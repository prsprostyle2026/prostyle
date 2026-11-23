"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { balanceLabel, rupees } from "@/lib/format";
import type { Customer } from "../bill/CustomerPicker";
import { createCustomer, deleteCustomer, updateCustomer } from "../bill/customers";
import StatTiles from "../components/StatTiles";
import CustomerForm from "./CustomerForm";

export type DashboardCustomer = Customer & { added: string; pending: number };
export type Stats = { total: number; newLast30: number; withPending: number; totalPending: number };

// null = no form open; "new" = adding; a customer = editing that one.
type Editing = null | "new" | DashboardCustomer;

export default function CustomersDashboard({ customers, stats }: { customers: DashboardCustomer[]; stats: Stats }) {
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Editing>(null);
  const [message, setMessage] = useState("");

  const q = query.trim().toLowerCase();
  const shown = q
    ? customers.filter((c) =>
        [c.name, c.phone, c.gstin, c.email, c.details, c.placeOfSupply].some((v) => v.toLowerCase().includes(q)),
      )
    : customers;

  function reload(note: string) {
    setMessage(note);
    startRefresh(() => router.refresh());
  }

  async function remove(c: DashboardCustomer) {
    if (!confirm(`Delete customer "${c.name}"? This can't be undone.`)) return;
    try {
      const result = await deleteCustomer(c.id);
      if (!result.ok) return setMessage(`${c.name}: ${result.error}`);
      reload(`Deleted ${c.name}.`);
    } catch {
      setMessage(`Could not delete ${c.name}. Try again.`);
    }
  }

  const tiles = [
    { label: "Total customers", value: stats.total },
    { label: "Added in last 30 days", value: stats.newLast30 },
    { label: "Customers with pending balance", value: stats.withPending },
    { label: "Total pending", value: rupees(stats.totalPending) },
  ];

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black uppercase italic tracking-tight">Customers</h1>
          <p className="mt-1 text-sm text-foreground/60">Everyone saved from bills or added here.</p>
        </div>
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="rounded-lg bg-accent px-4 py-2.5 text-sm font-bold text-accent-foreground hover:bg-accent-hover"
        >
          + Add customer
        </button>
      </div>

      <StatTiles tiles={tiles} />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <label className="w-full max-w-sm">
          <span className="sr-only">Search customers</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, phone, GSTIN, email, address…"
            className="w-full rounded-md border border-foreground/15 bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
          />
        </label>
        <p className="text-sm text-foreground/60" role="status">
          {refreshing ? "Updating…" : message || `${shown.length} of ${customers.length} shown`}
        </p>
      </div>

      {/* Phones: one card per customer */}
      <ul className="mt-3 space-y-2 md:hidden">
        {shown.length === 0 && (
          <li className="rounded-xl border border-foreground/10 px-4 py-8 text-center text-sm text-foreground/60">
            {customers.length ? "No customers match your search." : "No customers yet. Add one to get started."}
          </li>
        )}
        {shown.map((c) => (
          <li key={c.id} className="rounded-xl border border-foreground/10">
            <Link href={`/customers/${c.id}`} className="block px-4 pb-2 pt-3">
              <div className="flex items-baseline justify-between gap-3">
                <span className="truncate font-semibold">{c.name}</span>
                <span className={`shrink-0 tabular-nums ${c.pending > 0 ? "font-semibold text-accent-ink" : "text-sm text-foreground/60"}`}>
                  {c.pending ? balanceLabel(c.pending) : "No dues"}
                </span>
              </div>
              <p className="mt-0.5 truncate text-sm text-foreground/60">
                {[c.phone, c.gstin && `GSTIN ${c.gstin}`].filter(Boolean).join(" · ") || "No phone"}
              </p>
            </Link>
            <div className="flex border-t border-foreground/10 text-sm font-semibold">
              <Link href={`/customers/${c.id}/payment`} className="flex-1 py-2.5 text-center hover:bg-foreground/5">
                Payment
              </Link>
              <button type="button" onClick={() => setEditing(c)} className="flex-1 border-x border-foreground/10 py-2.5 hover:bg-foreground/5">
                Edit
              </button>
              <button type="button" onClick={() => remove(c)} className="flex-1 py-2.5 text-danger hover:bg-danger/10">
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* Wider screens: table */}
      <div className="mt-3 hidden overflow-x-auto rounded-xl border border-foreground/10 md:block">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-foreground/10 bg-foreground/[0.03] text-xs uppercase tracking-wider text-foreground/60">
            <tr>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Phone</th>
              <th className="px-4 py-3 font-semibold">GSTIN</th>
              <th className="px-4 py-3 text-right font-semibold">Pending</th>
              <th className="px-4 py-3 font-semibold">Added</th>
              <th className="px-4 py-3 font-semibold"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-foreground/10">
            {shown.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-foreground/60">
                  {customers.length ? "No customers match your search." : "No customers yet. Add one to get started."}
                </td>
              </tr>
            )}
            {shown.map((c) => (
              <tr key={c.id} className="align-top hover:bg-foreground/[0.02]">
                <td className="px-4 py-3">
                  <Link href={`/customers/${c.id}`} className="font-semibold hover:text-accent-ink hover:underline">
                    {c.name}
                  </Link>
                  {(c.email || c.details) && (
                    <p className="mt-0.5 max-w-xs truncate text-xs text-foreground/60">
                      {[c.email, c.details].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3 tabular-nums">{c.phone || "—"}</td>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">{c.gstin || "—"}</td>
                <td className={`whitespace-nowrap px-4 py-3 text-right tabular-nums ${c.pending > 0 ? "font-semibold text-accent-ink" : "text-foreground/60"}`}>
                  {c.pending ? balanceLabel(c.pending) : "—"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-foreground/60">{c.added}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <Link
                    href={`/customers/${c.id}/payment`}
                    className="rounded-md px-2 py-1 text-xs font-semibold hover:bg-foreground/5"
                  >
                    Payment
                  </Link>
                  <button
                    type="button"
                    onClick={() => setEditing(c)}
                    className="rounded-md px-2 py-1 text-xs font-semibold hover:bg-foreground/5"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(c)}
                    className="rounded-md px-2 py-1 text-xs font-semibold text-danger hover:bg-danger/10"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <CustomerForm
          key={editing === "new" ? "new" : editing.id}
          initial={editing === "new" ? undefined : editing}
          others={customers.filter((c) => editing === "new" || c.id !== editing.id)}
          onCancel={() => setEditing(null)}
          onSave={async (input) => {
            const result = editing === "new" ? await createCustomer(input) : await updateCustomer(editing.id, input);
            if (result.ok) {
              setEditing(null);
              reload(editing === "new" ? `Added ${result.customer.name}.` : `Saved ${result.customer.name}.`);
            }
            return result;
          }}
        />
      )}
    </main>
  );
}
