"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type ReactNode } from "react";
import { balanceLabel } from "@/lib/format";
import { createDocument, getCustomerBalance, updateDocument, type CustomerBalance, type DocInput } from "./bills";
import { computeTotals } from "./calc";
import CustomerPicker from "./CustomerPicker";
import {
  BUSINESS_LABELS,
  DEFAULT_BUSINESS,
  DEFAULT_SIGNATURE,
  DOC_TYPES,
  NUMBER_PREFIX,
  financialYear,
  isBillingType,
  type Business,
  type DocCustomer,
  type DocType,
} from "./docTypes";
import { GST_RATE_SUGGESTIONS, STATES, round2 } from "./gst";

// What the bill page passes in when editing a saved document or converting one.
export type InitialDoc = {
  mode: "edit" | "convert";
  id: string; // the document being edited, or the quotation/proforma being converted
  sourceLabel: string; // e.g. "Quotation EST/2026-27/004"
  docType: DocType;
  number: string; // edit: the fixed number; convert: ""
  financialYear: string | null;
  date: string;
  dueDate: string;
  customerId: string;
  customer: DocCustomer;
  items: { name: string; hsn: string; rate: number; qty: number; gst: number }[];
  applyGst: boolean;
  roundOff: boolean;
  paid: number;
  paymentNote: string;
  business: Business;
  signature: string;
  balanceBefore: number; // the customer's balance before this document
};

type Item = { id: number; name: string; hsn: string; rate: string; qty: string; gst: string };

// GST % each new item starts with.
const DEFAULT_GST_RATE = "5";

let nextItemId = 1;
const newItem = (): Item => ({ id: nextItemId++, name: "", hsn: "", rate: "", qty: "", gst: DEFAULT_GST_RATE });
const toNumber = (v: string) => (Number.isFinite(parseFloat(v)) ? parseFloat(v) : 0);
const money = (n: number) => n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

function isoDate(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const EMPTY_CUSTOMER: DocCustomer = { name: "", gstin: "", phone: "", email: "", details: "", placeOfSupply: "29-KARNATAKA" };

export default function BillMaker({ initial }: { initial?: InitialDoc }) {
  const router = useRouter();
  const mode = initial?.mode ?? "new";
  const editing = mode === "edit";
  const converting = mode === "convert";
  // Edit and convert keep the original customer: their balance and history belong to them.
  const customerLocked = editing || converting;

  // This component is client-only (see ClientBillMaker), so reading today's date here is safe.
  const today = isoDate(new Date());
  const [docType, setDocType] = useState<DocType>(initial?.docType ?? "Quotation");
  const [date, setDate] = useState(initial?.date ?? today);
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? today);
  const [customerId, setCustomerId] = useState<string | null>(initial?.customerId ?? null);
  const [customer, setCustomer] = useState<DocCustomer>(initial?.customer ?? EMPTY_CUSTOMER);
  const [items, setItems] = useState<Item[]>(() =>
    initial?.items.length
      ? initial.items.map((i) => ({ id: nextItemId++, name: i.name, hsn: i.hsn, rate: String(i.rate), qty: String(i.qty), gst: String(i.gst) }))
      : [newItem()],
  );
  const [applyGst, setApplyGst] = useState(initial?.applyGst ?? true);
  const [roundOff, setRoundOff] = useState(initial?.roundOff ?? true);
  const [advance, setAdvance] = useState(initial?.paid ? String(initial.paid) : "");
  const [advanceNote, setAdvanceNote] = useState(initial?.paymentNote ?? "");
  const [business, setBusiness] = useState<Business>(initial?.business ?? DEFAULT_BUSINESS);
  const [signature, setSignature] = useState(initial?.signature ?? DEFAULT_SIGNATURE);
  const [signatureError, setSignatureError] = useState("");
  // Balance from the server: given up front when editing/converting, fetched when a customer is picked.
  const [balance, setBalance] = useState<CustomerBalance | null>(
    initial ? { pending: initial.balanceBefore, invoices: -1, customerBills: -1 } : null,
  );
  const [balanceError, setBalanceError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const isBilling = isBillingType(docType);
  const isCustomerBill = docType === "Customer Bill";
  const docItems = items.map((it) => ({
    name: it.name,
    hsn: it.hsn,
    rate: toNumber(it.rate),
    qty: toNumber(it.qty),
    gst: toNumber(it.gst),
  }));
  const t = computeTotals({ items: docItems, applyGst, roundOff, placeOfSupply: customer.placeOfSupply, sellerGstin: business.gstin });
  const advancePaid = round2(toNumber(advance));
  const balanceBefore = balance?.pending ?? 0;
  const previousBalance = isCustomerBill ? balanceBefore : 0;
  const totalPayable = round2(t.total + previousBalance);
  const balanceDue = round2(totalPayable - advancePaid);
  const balanceAfter = round2(balanceBefore + t.total - advancePaid);

  const fy = financialYear(date || today);
  const numberPreview = editing ? initial!.number : `${NUMBER_PREFIX[docType]}/${fy}/…`;
  const fyMismatch = editing && initial!.financialYear && financialYear(date) !== initial!.financialYear;

  async function loadBalance(id: string) {
    setBalance(null);
    setBalanceError("");
    try {
      setBalance(await getCustomerBalance(id));
    } catch {
      setBalanceError("Could not fetch the pending balance. Pick the customer again to retry.");
    }
  }

  function changeDocType(next: DocType) {
    setDocType(next);
    setSaveError("");
    if (isBillingType(next) && customerId && !balance && !customerLocked) void loadBalance(customerId);
  }

  function updateItem(id: number, field: keyof Omit<Item, "id">, value: string) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, [field]: value } : it)));
  }

  function onSignatureUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setSignatureError("");
    if (!file) return;
    if (file.size > 500_000) {
      setSignatureError("Use an image under 500 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setSignature(String(reader.result));
    reader.readAsDataURL(file);
  }

  async function save() {
    if (!customerId) return;
    setSaving(true);
    setSaveError("");
    const input: DocInput = {
      docType,
      date,
      dueDate,
      customerId,
      customer,
      items: docItems,
      applyGst,
      roundOff,
      paid: advancePaid,
      paymentNote: advanceNote,
      business,
      signature,
    };
    try {
      const result = editing
        ? await updateDocument(initial!.id, input)
        : await createDocument(input, converting ? initial!.id : null);
      if (!result.ok) {
        setSaveError(result.error);
        setSaving(false);
        return;
      }
      // Open the saved document, which has the Share PDF and Print buttons.
      router.push(`/bills/${result.id}?saved=1`);
    } catch {
      setSaveError("Could not save. Check the connection and try again.");
      setSaving(false);
    }
  }

  const title = editing ? `Edit ${initial!.sourceLabel}` : converting ? `Convert ${initial!.sourceLabel}` : "Create Bill";
  const canSave = !!customerId && t.rows.length > 0 && !saving && !fyMismatch && (!isBilling || !!balance || !!balanceError);

  return (
    // Form only. After saving, the document opens with Share and Print (see /bills/[id]).
    // The Save bar is fixed to the bottom on phones and sticks to the bottom of the form on wide screens.
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-28 pt-6 sm:px-6 lg:pb-8 lg:pt-8">
      <section className="space-y-6">
        <div>
          <h1 className="text-2xl font-black uppercase italic tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-foreground/60">
            {editing
              ? "Changes are recorded in the customer's activity history."
              : converting
                ? "Choose Invoice or Customer Bill. The new document gets its own number and links back to the original."
                : "Fill in the details and save. You can then share the PDF or print it."}
          </p>
        </div>

        <Fieldset title="Document">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type">
              <select
                className={inputCls}
                value={docType}
                disabled={editing}
                onChange={(e) => changeDocType(e.target.value as DocType)}
              >
                {DOC_TYPES.filter((d) => !converting || isBillingType(d)).map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </Field>
            <Field label="Number">
              <input className={`${inputCls} bg-foreground/5`} value={numberPreview} readOnly aria-describedby="number-help" />
            </Field>
            <Field label="Date">
              <input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <Field label={docType === "Quotation" ? "Valid until" : "Due date"}>
              <input type="date" className={inputCls} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </Field>
          </div>
          <p id="number-help" className="text-xs text-foreground/60">
            {editing
              ? "The number is fixed."
              : "Numbers are assigned in order when you save, and restart each financial year (April–March)."}
          </p>
          {fyMismatch && (
            <p className="text-xs font-semibold text-accent">
              {initial!.number} belongs to financial year {initial!.financialYear}. Keep the date within it.
            </p>
          )}
        </Fieldset>

        <Fieldset title="Customer">
          {customerLocked ? (
            <p className="rounded-md bg-foreground/5 px-3 py-2 text-sm">
              <span className="font-semibold">{customer.name}</span>
              <span className="block text-xs text-foreground/60">
                The customer can&apos;t be changed here. To bill someone else, cancel this document and create a new one.
              </span>
            </p>
          ) : (
            <CustomerPicker
              onSelect={(c) => {
                setCustomerId(c.id);
                if (isBillingType(docType)) void loadBalance(c.id);
                else setBalance(null);
                setCustomer({
                  name: c.name,
                  gstin: c.gstin,
                  phone: c.phone,
                  email: c.email,
                  details: c.details,
                  placeOfSupply: c.placeOfSupply,
                });
              }}
            />
          )}
          {!customerId && (
            <p className="text-sm font-medium text-accent">Search or add a saved customer. Every document is saved against one.</p>
          )}
          {customerId && isBilling && (
            <div className="rounded-md bg-foreground/5 px-3 py-2 text-sm">
              {balanceError ? (
                <p className="font-medium text-accent">{balanceError}</p>
              ) : !balance ? (
                <p className="text-foreground/60">Fetching pending balance…</p>
              ) : (
                <div className="flex items-baseline justify-between gap-3">
                  <span>
                    {editing ? "Balance before this document" : "Pending balance"}
                    {balance.invoices >= 0 && (
                      <span className="block text-xs text-foreground/60">
                        {balance.invoices || balance.customerBills
                          ? `From ${plural(balance.invoices, "invoice")} and ${plural(balance.customerBills, "customer bill")}, less payments`
                          : "No earlier invoices or bills"}
                      </span>
                    )}
                  </span>
                  <span className={`font-bold ${balanceBefore > 0 ? "text-accent" : ""}`}>{balanceLabel(balanceBefore)}</span>
                </div>
              )}
            </div>
          )}
          <p className="border-t border-foreground/10 pt-3 text-xs text-foreground/60">
            Details printed on this document (edit here for a one-off change):
          </p>
          <Field label="Name">
            <input className={inputCls} value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} />
          </Field>
          <Field label="GSTIN (optional)">
            <input
              className={`${inputCls} uppercase`}
              value={customer.gstin}
              maxLength={15}
              onChange={(e) => setCustomer({ ...customer, gstin: e.target.value.toUpperCase() })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone (optional)">
              <input className={inputCls} type="tel" inputMode="tel" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} />
            </Field>
            <Field label="Email (optional)">
              <input className={inputCls} type="email" value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} />
            </Field>
          </div>
          <Field label="Address (optional)">
            <textarea rows={2} className={inputCls} value={customer.details} onChange={(e) => setCustomer({ ...customer, details: e.target.value })} />
          </Field>
          <Field label="Place of supply">
            <select className={inputCls} value={customer.placeOfSupply} onChange={(e) => setCustomer({ ...customer, placeOfSupply: e.target.value })}>
              {STATES.map(([code, name]) => (
                <option key={code} value={`${code}-${name}`}>{`${code}-${name}`}</option>
              ))}
            </select>
          </Field>
        </Fieldset>

        <Fieldset title="GST">
          <Toggle checked={applyGst} onChange={setApplyGst} label="Apply GST" />
          {applyGst && (
            <p className="text-xs text-foreground/60">
              {t.intraState
                ? "Same state as your GSTIN: tax is split into CGST + SGST."
                : "Different state from your GSTIN: tax is charged as IGST."}{" "}
              Item rates are entered before tax.
            </p>
          )}
          <Toggle checked={roundOff} onChange={setRoundOff} label="Round total to nearest rupee" />
        </Fieldset>

        <Fieldset title="Items">
          <datalist id="gst-rates">
            {GST_RATE_SUGGESTIONS.map((r) => (
              <option key={r} value={r} />
            ))}
          </datalist>
          {items.map((it, i) => {
            const taxable = round2(toNumber(it.rate) * toNumber(it.qty));
            const tax = applyGst ? round2((taxable * toNumber(it.gst)) / 100) : 0;
            return (
              <div key={it.id} className="space-y-2 rounded-lg border border-foreground/10 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground/60">Item {i + 1}</span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setItems((prev) => prev.filter((x) => x.id !== it.id))}
                      className="text-xs font-semibold text-accent hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <input className={inputCls} placeholder="Item name, e.g. School set" value={it.name} onChange={(e) => updateItem(it.id, "name", e.target.value)} />
                <div className={`grid grid-cols-2 gap-2 ${applyGst ? "sm:grid-cols-4" : "sm:grid-cols-3"}`}>
                  <SmallField label="HSN">
                    <input className={inputCls} value={it.hsn} onChange={(e) => updateItem(it.id, "hsn", e.target.value)} />
                  </SmallField>
                  {applyGst && (
                    <SmallField label="GST %">
                      <input className={inputCls} type="number" min="0" step="0.01" list="gst-rates" value={it.gst} onChange={(e) => updateItem(it.id, "gst", e.target.value)} />
                    </SmallField>
                  )}
                  <SmallField label="Rate (₹)">
                    <input className={inputCls} type="number" min="0" step="0.01" value={it.rate} onChange={(e) => updateItem(it.id, "rate", e.target.value)} />
                  </SmallField>
                  <SmallField label="Qty">
                    <input className={inputCls} type="number" min="0" step="1" value={it.qty} onChange={(e) => updateItem(it.id, "qty", e.target.value)} />
                  </SmallField>
                </div>
                <p className="text-right text-xs text-foreground/60">
                  {tax > 0 && <>₹{money(taxable)} + ₹{money(tax)} GST = </>}
                  Amount: ₹{money(round2(taxable + tax))}
                </p>
              </div>
            );
          })}
          <button
            type="button"
            onClick={() => setItems((prev) => [...prev, newItem()])}
            className="w-full rounded-lg border border-dashed border-foreground/25 py-2 text-sm font-semibold hover:border-accent hover:text-accent"
          >
            + Add item
          </button>
        </Fieldset>

        <Fieldset title="Totals">
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-foreground/70">Items / Qty</dt>
              <dd>{t.rows.length} / {t.totalQty}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-foreground/70">Taxable amount</dt>
              <dd className="tabular-nums">₹{money(t.taxableTotal)}</dd>
            </div>
            {t.taxLines.map((l) => (
              <div key={l.label} className="flex justify-between">
                <dt className="text-foreground/70">{l.label}</dt>
                <dd className="tabular-nums">₹{money(l.amount)}</dd>
              </div>
            ))}
            {t.roundOffAmount !== 0 && (
              <div className="flex justify-between">
                <dt className="text-foreground/70">Round off</dt>
                <dd className="tabular-nums">{t.roundOffAmount > 0 ? "+" : "-"}₹{money(Math.abs(t.roundOffAmount))}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-foreground/10 pt-1.5 text-base font-bold">
              <dt>Total</dt>
              <dd className="tabular-nums">₹{money(t.total)}</dd>
            </div>
          </dl>
        </Fieldset>

        <Fieldset title="Payment">
          <div className="grid grid-cols-2 gap-3">
            <Field label={isCustomerBill ? "Amount paid now (₹)" : "Advance paid (₹)"}>
              <input className={inputCls} type="number" min="0" step="0.01" placeholder="0.00" value={advance} onChange={(e) => setAdvance(e.target.value)} />
            </Field>
            <Field label="Payment note (optional)">
              <input className={inputCls} placeholder="e.g. UPI, 10 Nov" value={advanceNote} onChange={(e) => setAdvanceNote(e.target.value)} />
            </Field>
          </div>
          <dl className="space-y-1 rounded-md bg-foreground/5 px-3 py-2 text-sm">
            {isCustomerBill && (
              <>
                <div className="flex justify-between"><dt>This bill</dt><dd>₹{money(t.total)}</dd></div>
                <div className="flex justify-between">
                  <dt>Pending balance</dt>
                  <dd>{previousBalance < 0 ? "-" : "+"}₹{money(Math.abs(previousBalance))}</dd>
                </div>
                {advancePaid > 0 && <div className="flex justify-between"><dt>Paid now</dt><dd>-₹{money(advancePaid)}</dd></div>}
              </>
            )}
            <div className="flex justify-between font-bold">
              <dt>{isCustomerBill ? "Balance after this bill" : "Balance due"}</dt>
              <dd>₹{money(balanceDue)}</dd>
            </div>
            {docType === "Invoice" && customerId && balance && (
              <div className="flex justify-between border-t border-foreground/10 pt-1 text-foreground/70">
                <dt>Customer&apos;s total pending after this invoice</dt>
                <dd>{balanceLabel(balanceAfter)}</dd>
              </div>
            )}
          </dl>
          {!isBilling && advancePaid > 0 && (
            <p className="text-xs text-foreground/60">
              An advance on a {docType.toLowerCase()} isn&apos;t added to the customer&apos;s account until it&apos;s converted into
              an invoice or customer bill.
            </p>
          )}
          {advancePaid > totalPayable && (
            <p className="text-xs font-semibold text-accent">
              {isCustomerBill
                ? `Payment is more than what is owed. The customer will have ₹${money(-balanceDue)} credit.`
                : `Advance is more than the total. The customer has overpaid by ₹${money(-balanceDue)}.`}
            </p>
          )}
        </Fieldset>

        <Fieldset title="Authorized signature">
          <p className="text-xs text-foreground/60">
            The Prostyle stamp is added by default. Upload a different image (under 500 KB) to use it on this document only.
          </p>
          <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={onSignatureUpload} className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-foreground/10 file:px-3 file:py-2 file:text-sm file:font-semibold" />
          {signatureError && <p className="text-xs font-semibold text-accent">{signatureError}</p>}
          <div className="flex gap-4">
            {signature !== DEFAULT_SIGNATURE && (
              <button type="button" onClick={() => setSignature(DEFAULT_SIGNATURE)} className="text-xs font-semibold text-accent hover:underline">
                Use Prostyle stamp
              </button>
            )}
            {signature && (
              <button type="button" onClick={() => setSignature("")} className="text-xs font-semibold text-accent hover:underline">
                Remove signature
              </button>
            )}
          </div>
        </Fieldset>

        <details className="rounded-xl border border-foreground/10 p-4">
          <summary className="cursor-pointer text-sm font-bold uppercase tracking-wider">Business &amp; bank details</summary>
          <div className="mt-4 space-y-3">
            {(Object.keys(DEFAULT_BUSINESS) as (keyof Business)[]).map((key) => (
              <Field key={key} label={BUSINESS_LABELS[key]}>
                <input className={inputCls} value={business[key]} onChange={(e) => setBusiness((b) => ({ ...b, [key]: e.target.value }))} />
              </Field>
            ))}
          </div>
        </details>

      </section>

      {/* ---------- Save bar: fixed to the bottom on phones, sticky under the form on wide screens ---------- */}
      <div className="fixed inset-x-0 bottom-0 z-40 space-y-2 border-t border-foreground/10 bg-background/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:sticky lg:bottom-4 lg:mt-6 lg:rounded-xl lg:border lg:p-3 lg:shadow-lg">
        {saveError && <p role="alert" className="text-sm font-medium text-accent">{saveError}</p>}
        <div className="flex items-center gap-3">
          <div className="min-w-0 shrink-0 text-right leading-tight">
            <p className="text-[11px] font-medium uppercase tracking-wider text-foreground/60">Total</p>
            <p className="text-lg font-black tabular-nums">₹{money(t.total)}</p>
          </div>
          <button
            type="button"
            onClick={save}
            disabled={!canSave}
            title={!customerId ? "Pick a saved customer first" : t.rows.length === 0 ? "Add at least one item" : undefined}
            className="flex-1 rounded-lg bg-accent py-3 text-sm font-bold uppercase tracking-wider text-white shadow-lg hover:bg-accent-hover disabled:bg-foreground/30 disabled:shadow-none"
          >
            {saving ? "Saving…" : editing ? "Save changes" : "Save"}
          </button>
          {customerLocked && (
            <Link
              href={`/bills/${initial!.id}`}
              className="rounded-lg border border-foreground/20 bg-background px-4 py-3 text-sm font-semibold hover:bg-foreground/5"
            >
              Cancel
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}

const inputCls =
  "w-full rounded-md border border-foreground/15 bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 disabled:opacity-60";

function Fieldset({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-3 rounded-xl border border-foreground/10 p-4">
      <legend className="px-1 text-sm font-bold uppercase tracking-wider">{title}</legend>
      {children}
    </fieldset>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-foreground/70">{label}</span>
      {children}
    </label>
  );
}

function SmallField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-0.5">
      <span className="text-[11px] text-foreground/60">{label}</span>
      {children}
    </label>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-(--accent)" />
      {label}
    </label>
  );
}
