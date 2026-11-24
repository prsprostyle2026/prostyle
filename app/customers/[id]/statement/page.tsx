import type { Metadata } from "next";
import SheetLogo from "@/app/bill/SheetLogo";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { displayDate } from "@/app/bill/BillSheet";
import { DEFAULT_BUSINESS, financialYear } from "@/app/bill/docTypes";
import { requireUser } from "@/lib/auth";
import { getCustomerSummary } from "@/lib/customer-data";
import { getStatement } from "@/lib/documents";
import { money } from "@/lib/format";
import DateRangeForm from "../../../components/DateRangeForm";
import FitToWidth from "../../../components/FitToWidth";
import PrintButton from "../../../components/PrintButton";
import StaffBar from "../../../components/StaffBar";

export const metadata: Metadata = {
  title: "Statement — Prostyle Sports Wear",
  robots: { index: false, follow: false },
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default function StatementPage({ params, searchParams }: PageProps<"/customers/[id]/statement">) {
  return (
    <Suspense fallback={<p className="p-8 text-center text-sm text-foreground/60">Loading…</p>}>
      <StatementContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

// Positive = customer owes us (Dr), negative = we owe them (Cr).
const drcr = (n: number) => (n === 0 ? "0.00" : `${money(Math.abs(n))} ${n > 0 ? "Dr" : "Cr"}`);

async function StatementContent({
  params,
  searchParams,
}: {
  params: PageProps<"/customers/[id]/statement">["params"];
  searchParams: PageProps<"/customers/[id]/statement">["searchParams"];
}) {
  const user = await requireUser();
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const customer = await getCustomerSummary(id);
  if (!customer) notFound();

  // Default: from the start of this financial year to today (India time).
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
  const fyStart = `${financialYear(today).slice(0, 4)}-04-01`;
  const from = typeof sp.from === "string" && DATE_RE.test(sp.from) ? sp.from : fyStart;
  const to = typeof sp.to === "string" && DATE_RE.test(sp.to) ? sp.to : today;
  const { opening, entries } = await getStatement(id, from, to);
  const closing = entries.length ? entries[entries.length - 1].balance : opening;
  const totalDebit = entries.reduce((s, e) => s + e.debit, 0);
  const totalCredit = entries.reduce((s, e) => s + e.credit, 0);
  const business = DEFAULT_BUSINESS;

  return (
    <>
      <StaffBar user={user} />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6 sm:py-8 print:max-w-none print:p-0">
        <div className="mb-4 space-y-3 print:hidden">
          <Link href={`/customers/${id}`} className="text-sm font-semibold text-foreground/60 hover:text-accent-ink">
            ← {customer.name}
          </Link>
          <DateRangeForm from={from} to={to}>
            <PrintButton fileName={`Statement_${customer.name.replace(/\s+/g, "_")}_${from}_to_${to}`} />
          </DateRangeForm>
        </div>

        <FitToWidth>
          <div className="bill-sheet relative mx-auto min-h-[297mm] w-[210mm] bg-white p-[12mm] text-[12px] text-neutral-800 shadow-xl ring-1 ring-black/5 print:shadow-none print:ring-0">
            <SheetLogo />
            <p className="text-lg font-bold uppercase tracking-[0.3em] text-gold-dark">Statement of Account</p>
            <div className="pr-[50mm]">
              <h2 className="mt-3 text-2xl font-bold text-neutral-900">{business.name}</h2>
              <p><span className="font-semibold">GSTIN</span> <span className="font-bold">{business.gstin}</span></p>
              <p className="leading-snug">{business.address1}</p>
              <p className="leading-snug">{business.address2}</p>
              <p className="leading-snug">{business.address3}</p>
            </div>

            <div className="mt-5 flex justify-between gap-6">
              <div>
                <p className="font-semibold">Customer:</p>
                <p className="text-[14px] font-bold">{customer.name}</p>
                {customer.gstin && <p>GSTIN {customer.gstin}</p>}
                {customer.details && <p className="whitespace-pre-line">{customer.details}</p>}
                {customer.phone && <p>Ph: {customer.phone}</p>}
              </div>
              <div className="text-right">
                <p className="font-semibold">Period</p>
                <p className="font-bold">{displayDate(from)} – {displayDate(to)}</p>
              </div>
            </div>

            <table className="mt-5 w-full border-collapse">
              <thead>
                <tr className="border-y border-gold bg-gold-soft text-left">
                  <th className="py-1.5 pl-2 font-semibold">Date</th>
                  <th className="py-1.5 font-semibold">Particulars</th>
                  <th className="py-1.5 text-right font-semibold">Debit (₹)</th>
                  <th className="py-1.5 text-right font-semibold">Credit (₹)</th>
                  <th className="py-1.5 pr-2 text-right font-semibold">Balance (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-neutral-200">
                  <td className="py-1.5 pl-2">{displayDate(from)}</td>
                  <td className="py-1.5 font-semibold">Balance brought forward</td>
                  <td /><td />
                  <td className="py-1.5 pr-2 text-right font-semibold">{drcr(opening)}</td>
                </tr>
                {entries.map((e) => (
                  <tr key={e.entryId} className="border-b border-neutral-200 align-top">
                    <td className="py-1.5 pl-2 whitespace-nowrap">{displayDate(e.date)}</td>
                    <td className="py-1.5">
                      {e.kind === "opening" ? (
                        <>
                          <span className="font-semibold">Opening balance</span> (from before this account)
                          {e.note && <span className="block text-[11px] text-neutral-500">{e.note}</span>}
                        </>
                      ) : e.kind === "bill" ? (
                        <>
                          {e.docType} <span className="font-semibold">{e.ref}</span>
                          {e.credit > 0 && <span className="block text-[11px] text-neutral-500">Paid at billing{e.note ? ` (${e.note})` : ""}</span>}
                        </>
                      ) : (
                        <>
                          Payment received — {e.ref}
                          {e.note && <span className="block text-[11px] text-neutral-500">{e.note}</span>}
                        </>
                      )}
                    </td>
                    <td className="py-1.5 text-right tabular-nums">{e.debit ? money(e.debit) : ""}</td>
                    <td className="py-1.5 text-right tabular-nums">{e.credit ? money(e.credit) : ""}</td>
                    <td className="py-1.5 pr-2 text-right tabular-nums">{drcr(e.balance)}</td>
                  </tr>
                ))}
                {entries.length === 0 && (
                  <tr className="border-b border-neutral-200">
                    <td colSpan={5} className="py-4 text-center text-neutral-400">No transactions in this period.</td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="border-b border-gold font-semibold">
                  <td className="py-1.5 pl-2" colSpan={2}>Totals for the period</td>
                  <td className="py-1.5 text-right tabular-nums">{money(totalDebit)}</td>
                  <td className="py-1.5 text-right tabular-nums">{money(totalCredit)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>

            <div className="mt-3 flex justify-end">
              <div className="w-72 rounded-lg border-2 border-gold px-4 py-2 text-gold-dark">
                <div className="flex items-baseline justify-between text-base font-bold">
                  <span>{closing < 0 ? "Credit balance" : "Balance due"}</span>
                  <span>₹{money(Math.abs(closing))}</span>
                </div>
                <p className="text-[11px] text-neutral-500">as on {displayDate(to)}</p>
              </div>
            </div>
            <p className="mt-6 text-[11px] text-neutral-500">
              Includes the opening balance, invoices, customer bills and payments. Cancelled entries, quotations and proforma invoices are not included.
            </p>
          </div>
        </FitToWidth>
      </main>
    </>
  );
}
