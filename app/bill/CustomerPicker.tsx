"use client";

import { useEffect, useState, type KeyboardEvent } from "react";
import { deleteCustomer, listCustomers, saveCustomer } from "./customers";
import { STATES } from "./gst";
import { isValidPhone, phoneKey } from "./phone";

export type Customer = {
  id: string;
  name: string;
  gstin: string;
  phone: string;
  email: string;
  details: string; // address
  placeOfSupply: string;
};

// Customers are stored in Postgres (see ./customers.ts). They used to live in this
// browser's localStorage; any found there are uploaded once, then removed.
const LEGACY_STORAGE_KEY = "prostyle.customers";

function readLegacyCustomers(): Partial<Customer>[] {
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<Customer>[]) : [];
  } catch {
    return [];
  }
}

const sortByName =(list: Customer[]) => [...list].sort((a, b) => a.name.localeCompare(b.name));

const EMPTY_FORM = { name: "", gstin: "", phone: "", email: "", details: "", placeOfSupply: "29-KARNATAKA" };

type FormErrors = { name?: string; phone?: string };

const errorCls = "border-accent ring-2 ring-accent/30";

const inputCls =
  "w-full rounded-md border border-foreground/15 bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/30";

export default function CustomerPicker({ onSelect }: { onSelect: (c: Customer) => void }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const legacy = readLegacyCustomers().filter((c) => c.name?.trim());
        const notUploaded: Partial<Customer>[] = [];
        for (const c of legacy) {
          const result = await saveCustomer({
            name: c.name ?? "",
            gstin: c.gstin ?? "",
            phone: c.phone ?? "",
            email: c.email ?? "",
            details: c.details ?? "",
            placeOfSupply: c.placeOfSupply ?? EMPTY_FORM.placeOfSupply,
          });
          if (!result.ok) notUploaded.push(c);
        }
        if (legacy.length) {
          // Keep any that were rejected (e.g. duplicate phone) so they aren't lost.
          try {
            if (notUploaded.length) localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(notUploaded));
            else localStorage.removeItem(LEGACY_STORAGE_KEY);
          } catch {}
          if (notUploaded.length && !cancelled) {
            setMessage(
              `Not moved to the database (name or phone problem; add them again): ${notUploaded.map((c) => c.name).join(", ")}.`,
            );
          }
        }
        const list = await listCustomers();
        if (!cancelled) setCustomers(sortByName(list));
      } catch {
        if (!cancelled) setMessage("Could not load saved customers. Check the database connection.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const q = query.trim().toLowerCase();
  const matches = q
    ? customers.filter((c) =>
        [c.name, c.gstin, c.phone, c.email, c.details].some((v) => v.toLowerCase().includes(q)),
      )
    : customers;

  function choose(c: Customer) {
    onSelect(c);
    setQuery("");
    setSearchOpen(false);
    setMessage(`Selected ${c.name}.`);
  }

  function onSearchKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSearchOpen(true);
      setHighlight((h) => Math.min(h + 1, matches.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter" && searchOpen && matches[highlight]) {
      e.preventDefault();
      choose(matches[highlight]);
    } else if (e.key === "Escape") {
      setSearchOpen(false);
    }
  }

  async function remove(c: Customer) {
    if (!confirm(`Delete saved customer "${c.name}"?`)) return;
    try {
      const result = await deleteCustomer(c.id);
      if (!result.ok) return setMessage(result.error);
      setCustomers((list) => list.filter((x) => x.id !== c.id));
    } catch {
      setMessage(`Could not delete ${c.name}. Try again.`);
    }
  }

  async function addCustomer() {
    const name = form.name.trim();
    const errs: FormErrors = {};
    if (!name) errs.name = "Customer name is required.";
    if (!form.phone.trim()) errs.phone = "Phone number is required.";
    else if (!isValidPhone(form.phone)) errs.phone = "Enter a valid 10-digit phone number.";
    setErrors(errs);
    if (errs.name || errs.phone) return;
    // Same name again updates the existing entry instead of creating a duplicate.
    const existing = customers.find((c) => c.name.toLowerCase() === name.toLowerCase());
    // Quick check against the loaded list; the database enforces it too.
    const phoneOwner = customers.find(
      (c) => c.phone && c.name.toLowerCase() !== name.toLowerCase() && phoneKey(c.phone) === phoneKey(form.phone),
    );
    if (phoneOwner) {
      setErrors({ phone: `This phone number already belongs to ${phoneOwner.name}.` });
      return;
    }
    let customer: Customer;
    setSaving(true);
    try {
      const result = await saveCustomer({ ...form, name });
      if (!result.ok) {
        if (result.field) setErrors({ [result.field]: result.error });
        else setMessage(result.error);
        return;
      }
      customer = result.customer;
    } catch {
      setMessage("Could not save the customer. Check the database connection.");
      return;
    } finally {
      setSaving(false);
    }
    setCustomers((list) => sortByName([...list.filter((c) => c.id !== customer.id), customer]));
    onSelect(customer);
    setForm(EMPTY_FORM);
    setErrors({});
    setAddOpen(false);
    setMessage(existing ? `Updated ${name}.` : `Saved ${name} and added to this bill.`);
  }

  return (
    <div className="space-y-3">
      {/* ---- Search customer ---- */}
      <div className="relative">
        <label htmlFor="customer-search" className="text-xs font-medium text-foreground/70">
          Search customer
        </label>
        <div className="relative mt-1">
          <input
            id="customer-search"
            role="combobox"
            aria-expanded={searchOpen}
            aria-controls="customer-results"
            autoComplete="off"
            className={`${inputCls} pr-9`}
            placeholder={loading ? "Loading customers…" : customers.length ?`Search ${customers.length} saved customers…` : "No saved customers yet"}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setHighlight(0);
              setSearchOpen(true);
            }}
            onFocus={() => setSearchOpen(true)}
            onBlur={() => setSearchOpen(false)}
            onKeyDown={onSearchKey}
          />
          <button
            type="button"
            tabIndex={-1}
            aria-label="Show all customers"
            onMouseDown={(e) => {
              e.preventDefault();
              setSearchOpen((o) => !o);
            }}
            className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-foreground/50"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
              <path d="M5.2 7.2a.75.75 0 0 1 1.06 0L10 10.94l3.74-3.74a.75.75 0 1 1 1.06 1.06l-4.27 4.27a.75.75 0 0 1-1.06 0L5.2 8.26a.75.75 0 0 1 0-1.06z" />
            </svg>
          </button>
        </div>

        {searchOpen && (
          <ul
            id="customer-results"
            role="listbox"
            className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-md border border-foreground/15 bg-background py-1 shadow-lg"
          >
            {matches.length === 0 && (
              <li className="px-3 py-2 text-sm text-foreground/60">
                {customers.length ? "No matching customers." : "No saved customers yet. Use “Add customer” below."}
              </li>
            )}
            {matches.map((c, i) => (
              <li
                key={c.id}
                role="option"
                aria-selected={i === highlight}
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(c);
                }}
                onMouseEnter={() => setHighlight(i)}
                className={`flex cursor-pointer items-start justify-between gap-2 px-3 py-2 text-sm ${i === highlight ? "bg-foreground/5" : ""}`}
              >
                <span className="min-w-0">
                  <span className="block font-semibold">{c.name}</span>
                  <span className="block truncate text-xs text-foreground/60">
                    {[c.phone, c.email, c.gstin, c.placeOfSupply].filter(Boolean).join(" · ")}
                  </span>
                </span>
                <button
                  type="button"
                  aria-label={`Delete ${c.name}`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    remove(c);
                  }}
                  className="shrink-0 rounded px-1.5 text-foreground/40 hover:bg-accent/10 hover:text-accent-ink"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ---- Add customer ---- */}
      <div className="rounded-lg border border-foreground/10">
        <button
          type="button"
          aria-expanded={addOpen}
          onClick={() => setAddOpen((o) => !o)}
          className="flex w-full items-center justify-between px-3 py-2 text-sm font-semibold hover:text-accent-ink"
        >
          <span>+ Add customer</span>
          <svg viewBox="0 0 20 20" className={`h-4 w-4 transition-transform ${addOpen ? "rotate-180" : ""}`} fill="currentColor">
            <path d="M5.2 7.2a.75.75 0 0 1 1.06 0L10 10.94l3.74-3.74a.75.75 0 1 1 1.06 1.06l-4.27 4.27a.75.75 0 0 1-1.06 0L5.2 8.26a.75.75 0 0 1 0-1.06z" />
          </svg>
        </button>
        {addOpen && (
          <div className="space-y-2 border-t border-foreground/10 p-3">
            <div>
              <input
                className={`${inputCls} ${errors.name ? errorCls : ""}`}
                placeholder="Customer name *"
                aria-required="true"
                aria-invalid={!!errors.name}
                value={form.name}
                onChange={(e) => {
                  setForm({ ...form, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: undefined });
                }}
              />
              {errors.name && <p className="mt-1 text-xs font-medium text-danger">{errors.name}</p>}
            </div>
            <div>
              <input
                className={`${inputCls} ${errors.phone ? errorCls : ""}`}
                type="tel"
                inputMode="tel"
                placeholder="Phone number *"
                aria-required="true"
                aria-invalid={!!errors.phone}
                value={form.phone}
                onChange={(e) => {
                  setForm({ ...form, phone: e.target.value });
                  if (errors.phone) setErrors({ ...errors, phone: undefined });
                }}
              />
              {errors.phone && <p className="mt-1 text-xs font-medium text-danger">{errors.phone}</p>}
            </div>
            <input className={`${inputCls} uppercase`} placeholder="GSTIN (optional)" maxLength={15} value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value })} />
            <input className={inputCls} type="email" placeholder="Email (optional)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <textarea rows={2} className={inputCls} placeholder="Address (optional)" value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} />
            <select className={inputCls} value={form.placeOfSupply} onChange={(e) => setForm({ ...form, placeOfSupply: e.target.value })}>
              {STATES.map(([code, name]) => (
                <option key={code} value={`${code}-${name}`}>{`${code}-${name}`}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button type="button" onClick={addCustomer} disabled={saving} className="flex-1 rounded-md bg-accent py-2 text-sm font-bold text-accent-foreground hover:bg-accent-hover disabled:opacity-60">
                {saving ? "Saving…" : "Save customer"}
              </button>
              <button type="button" onClick={() => { setAddOpen(false); setForm(EMPTY_FORM); setErrors({}); }} className="rounded-md border border-foreground/20 px-3 py-2 text-sm font-semibold hover:bg-foreground/5">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {message && <p className="text-xs font-medium text-accent-ink" role="status">{message}</p>}
    </div>
  );
}
