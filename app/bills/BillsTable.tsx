"use client";

import Link from "next/link";
import { useState } from "react";
import type { BillRow } from "@/lib/customer-data";
import { balanceLabel, rupees } from "@/lib/format";
import BillItems, { CancelledBadge, DocTypeBadge } from "./BillItems";

const TYPES = ["All", "Invoice", "Customer Bill", "Quotation", "Proforma Invoice"] as const;
const TYPE_LABEL: Record<(typeof TYPES)[number], string> = {
  All: "All",
  Invoice: "Invoices",
  "Customer Bill": "Customer bills",
  Quotation: "Quotations",
  "Proforma Invoice": "Proformas",
};

export default function BillsTable({ bills }: { bills: BillRow[] }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<(typeof TYPES)[number]>("All");
  const [showCancelled, setShowCancelled] = useState(false);
  const q = query.trim().toLowerCase();
  const shown = bills.filter(
    (b) =>
      (type === "All" || b.docType === type) &&
      (showCancelled || !b.voided) &&
      (!q ||
        [b.number, b.customerName, b.createdBy, b.billDate, ...b.items.map((i) => i.name)].some((v) =>
          v.toLowerCase().includes(q),
        )),
  );
  const shownTotal = shown.filter((b) => !b.voided).reduce((s, b) => s + b.total, 0);
  const cancelledCount = bills.filter((b) => b.voided).length;

  return (
    <>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <label className="w-full max-w-sm">
          <span className="sr-only">Search</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search number, customer, item, created by…"
            className="w-full rounded-md border border-foreground/15 bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
          />
        </label>
        <div role="group" aria-label="Filter by type" className="flex flex-wrap rounded-md border border-foreground/15 p-0.5 text-sm">
          {TYPES.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={type === t}
              onClick={() => setType(t)}
              className={`rounded px-3 py-1.5 font-semibold ${type === t ? "bg-accent text-white" : "text-foreground/70 hover:bg-foreground/5"}`}
            >
              {TYPE_LABEL[t]}
            </button>
          ))}
        </div>
        {cancelledCount > 0 && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={showCancelled} onChange={(e) => setShowCancelled(e.target.checked)} className="h-4 w-4 accent-(--accent)" />
            Show cancelled ({cancelledCount})
          </label>
        )}
        <p className="text-sm text-foreground/60 sm:ml-auto" role="status">
          {shown.length} of {bills.length} · {rupees(shownTotal)}
        </p>
      </div>

      {/* Phones: one card per document */}
      <ul className="mt-3 space-y-2 md:hidden">
        {shown.length === 0 && (
          <li className="rounded-xl border border-foreground/10 px-4 py-8 text-center text-sm text-foreground/60">
            {bills.length ? "Nothing matches these filters." : "Nothing saved in this date range."}
          </li>
        )}
        {shown.map((b) => (
          <li key={b.id} className={`rounded-xl border border-foreground/10 ${b.voided ? "opacity-60" : ""}`}>
            <Link href={`/bills/${b.id}`} className="block px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className={`font-mono text-sm font-semibold ${b.voided ? "line-through" : ""}`}>{b.number}</p>
                  <p className="mt-0.5">
                    <DocTypeBadge type={b.docType} />
                    {b.voided && <CancelledBadge />}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-semibold tabular-nums">{rupees(b.total)}</p>
                  {b.paid > 0 && <p className="text-xs text-foreground/60">paid {rupees(b.paid)}</p>}
                </div>
              </div>
              <p className="mt-1.5 truncate text-sm">
                <span className="font-semibold">{b.customerName}</span>
                <span className="text-foreground/60"> · {b.billDate}</span>
              </p>
              <p className="mt-0.5 text-xs text-foreground/60">
                {b.items.length} {b.items.length === 1 ? "item" : "items"} · by {b.createdBy}
                {b.convertedTo && ` · converted to ${b.convertedTo}`}
                {b.balanceAfter !== null && ` · balance after ${balanceLabel(b.balanceAfter)}`}
              </p>
            </Link>
          </li>
        ))}
      </ul>

      {/* Wider screens: table */}
      <div className="mt-3 hidden overflow-x-auto rounded-xl border border-foreground/10 md:block">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-foreground/10 bg-foreground/[0.03] text-xs uppercase tracking-wider text-foreground/60">
            <tr>
              <th className="px-4 py-3 font-semibold">Number</th>
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">Customer</th>
              <th className="px-4 py-3 text-right font-semibold">Total</th>
              <th className="px-4 py-3 text-right font-semibold">Paid</th>
              <th className="px-4 py-3 text-right font-semibold">Balance after</th>
              <th className="px-4 py-3 font-semibold">Created by</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-foreground/10">
            {shown.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-foreground/60">
                  {bills.length ? "Nothing matches these filters." : "Nothing saved in this date range."}
                </td>
              </tr>
            )}
            {shown.map((b) => (
              <tr key={b.id} className={`align-top hover:bg-foreground/[0.02] ${b.voided ? "text-foreground/50" : ""}`}>
                <td className="px-4 py-3">
                  <p className="font-semibold">
                    <Link href={`/bills/${b.id}`} className={`hover:text-accent hover:underline ${b.voided ? "line-through" : ""}`}>
                      {b.number}
                    </Link>
                    <DocTypeBadge type={b.docType} />
                    {b.voided && <CancelledBadge />}
                  </p>
                  {b.convertedTo && <p className="text-xs text-foreground/60">Converted to {b.convertedTo}</p>}
                  <BillItems items={b.items} />
                </td>
                <td className="whitespace-nowrap px-4 py-3">{b.billDate}</td>
                <td className="px-4 py-3">
                  <Link href={`/customers/${b.customerId}`} className="font-semibold hover:text-accent hover:underline">
                    {b.customerName}
                  </Link>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">{rupees(b.total)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">{b.paid ? rupees(b.paid) : "—"}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                  {b.balanceAfter === null ? <span className="text-xs text-foreground/50">—</span> : balanceLabel(b.balanceAfter)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-foreground/60">
                  {b.createdBy}
                  <span className="block">{b.createdAt}</span>
                  {b.updatedBy && <span className="block">edited by {b.updatedBy}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
