import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { requireUser } from "@/lib/auth";
import { getCustomerAudit, getCustomerBills, getCustomerPayments, getCustomerSummary } from "@/lib/customer-data";
import { balanceLabel, rupees } from "@/lib/format";
import StaffBar from "../../components/StaffBar";
import StatTiles from "../../components/StatTiles";
import BillItems, { CancelledBadge, DocTypeBadge } from "../../bills/BillItems";
import OpeningBalanceForm from "./OpeningBalanceForm";

export const metadata: Metadata = {
  title: "Customer — Prostyle Sports Wear",
  robots: { index: false, follow: false },
};

export default function CustomerPage({ params }: PageProps<"/customers/[id]">) {
  return (
    <Suspense fallback={<p className="p-8 text-center text-sm text-foreground/60">Loading…</p>}>
      <CustomerContent params={params} />
    </Suspense>
  );
}

async function CustomerContent({ params }: { params: PageProps<"/customers/[id]">["params"] }) {
  const me = await requireUser();
  const { id } = await params;
  const customer = await getCustomerSummary(id);
  if (!customer) notFound();
  const [bills, payments, audit] = await Promise.all([
    getCustomerBills(id),
    getCustomerPayments(id),
    getCustomerAudit(id),
  ]);

  const tiles = [
    { label: "Pending balance", value: balanceLabel(customer.pending), strong: customer.pending > 0 },
    {
      label: `Billed (${plural(customer.invoiceCount, "invoice")}, ${plural(customer.customerBillCount, "customer bill")})`,
      value: rupees(customer.billed),
    },
    { label: "Paid on invoices & bills", value: rupees(customer.paidOnBills) },
    { label: "Separate payments", value: rupees(customer.payments) },
    ...(customer.openingBalance !== 0 ? [{ label: "Opening balance (included above)", value: balanceLabel(customer.openingBalance) }] : []),
  ];
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
  const openingMax = customer.firstEntryDate && customer.firstEntryDate < today ? customer.firstEntryDate : today;

  return (
    <>
      <StaffBar user={me} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <Link href="/customers" className="text-sm font-semibold text-foreground/60 hover:text-accent-ink">
          ← All customers
        </Link>

        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-black uppercase italic tracking-tight">{customer.name}</h1>
            <p className="mt-1 text-sm text-foreground/70">
              {[customer.phone, customer.email, customer.gstin && `GSTIN ${customer.gstin}`, customer.placeOfSupply]
                .filter(Boolean)
                .join(" · ")}
            </p>
            {customer.details && <p className="mt-0.5 text-sm text-foreground/60">{customer.details}</p>}
            <p className="mt-2 text-xs text-foreground/50">
              Added {customer.createdBy ? `by ${customer.createdBy} ` : ""}on {customer.createdAt}
              {customer.updatedBy && ` · last changed by ${customer.updatedBy} on ${customer.updatedAt}`}
            </p>
          </div>
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
            <Link
              href={`/customers/${id}/statement`}
              className="rounded-lg border border-foreground/20 px-4 py-2.5 text-center text-sm font-semibold hover:bg-foreground/5"
            >
              Statement
            </Link>
            <Link
              href={`/customers/${id}/payment`}
              className="rounded-lg bg-accent px-4 py-2.5 text-center text-sm font-bold text-accent-foreground hover:bg-accent-hover"
            >
              + Record payment
            </Link>
          </div>
        </div>

        <StatTiles tiles={tiles} />

        <Section title="Opening balance">
          <OpeningBalanceForm
            customerId={id}
            amount={customer.openingBalance}
            date={customer.openingDate}
            note={customer.openingNote}
            maxDate={openingMax}
          />
        </Section>

        <Section title={`Documents (${bills.length})`}>
          {bills.length === 0 ? (
            <Empty>None yet. Create one from Create bill.</Empty>
          ) : (
            <>
            {/* Phones: one card per document */}
            <ul className="divide-y divide-foreground/10 md:hidden">
              {bills.map((b) => (
                <li key={b.id} className={b.voided ? "opacity-60" : ""}>
                  <Link href={`/bills/${b.id}`} className="block px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className={`font-mono text-sm font-semibold ${b.voided ? "line-through" : ""}`}>{b.number}</p>
                        <p className="mt-0.5"><DocTypeBadge type={b.docType} />{b.voided && <CancelledBadge />}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-semibold tabular-nums">{rupees(b.total)}</p>
                        {b.paid > 0 && <p className="text-xs text-foreground/60">paid {rupees(b.paid)}</p>}
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-foreground/60">
                      {b.billDate} · by {b.createdBy}
                      {b.balanceAfter !== null && ` · balance after ${balanceLabel(b.balanceAfter)}`}
                      {b.convertedTo && ` · converted to ${b.convertedTo}`}
                    </p>
                    {b.voided && b.voidReason && <p className="mt-0.5 text-xs">Reason: {b.voidReason}</p>}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="text-xs uppercase tracking-wider text-foreground/60">
                  <tr>
                    <Th>Number</Th><Th>Date</Th><Th right>Total</Th><Th right>Paid</Th>
                    <Th right>Balance after</Th><Th>Created by</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-foreground/10">
                  {bills.map((b) => (
                    <tr key={b.id} className={`align-top ${b.voided ? "text-foreground/50" : ""}`}>
                      <td className="px-4 py-3">
                        <p className="font-semibold">
                          <Link href={`/bills/${b.id}`} className={`hover:text-accent-ink hover:underline ${b.voided ? "line-through" : ""}`}>
                            {b.number}
                          </Link>
                          <DocTypeBadge type={b.docType} />
                          {b.voided && <CancelledBadge />}
                        </p>
                        {b.convertedTo && <p className="text-xs text-foreground/60">Converted to {b.convertedTo}</p>}
                        {b.voided && b.voidReason && <p className="text-xs">Reason: {b.voidReason}</p>}
                        <BillItems items={b.items} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">{b.billDate}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">{rupees(b.total)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                        {b.paid ? rupees(b.paid) : "—"}
                        {b.paymentNote && <span className="block text-xs text-foreground/50">{b.paymentNote}</span>}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                        {b.balanceAfter === null ? <span className="text-xs text-foreground/50">not on account</span> : balanceLabel(b.balanceAfter)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-foreground/60">
                        {b.createdBy}<span className="block">{b.createdAt}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>
          )}
        </Section>

        <Section title={`Payments (${payments.length})`}>
          {payments.length === 0 ? (
            <Empty>No separate payments yet.</Empty>
          ) : (
            <>
            {/* Phones: one card per payment */}
            <ul className="divide-y divide-foreground/10 md:hidden">
              {payments.map((p) => (
                <li key={p.id} className={p.voided ? "opacity-60" : ""}>
                  <Link href={`/payments/${p.id}`} className="block px-4 py-3">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-sm">
                        <span className="font-semibold">{p.paidOn}</span> · {p.method || "—"}
                        {p.voided && <CancelledBadge />}
                      </span>
                      <span className={`font-semibold tabular-nums ${p.voided ? "line-through" : ""}`}>{rupees(p.amount)}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-foreground/60">
                      {p.note ? `${p.note} · ` : ""}by {p.createdBy} · tap for receipt
                    </p>
                    {p.voided && p.voidReason && <p className="mt-0.5 text-xs">Cancelled: {p.voidReason}</p>}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="text-xs uppercase tracking-wider text-foreground/60">
                  <tr><Th>Paid on</Th><Th right>Amount</Th><Th>Method</Th><Th>Note</Th><Th>Recorded by</Th></tr>
                </thead>
                <tbody className="divide-y divide-foreground/10">
                  {payments.map((p) => (
                    <tr key={p.id} className={p.voided ? "text-foreground/50" : ""}>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Link href={`/payments/${p.id}`} className="font-semibold hover:text-accent-ink hover:underline">
                          {p.paidOn}
                        </Link>
                        {p.voided && <CancelledBadge />}
                        <span className="block text-xs text-foreground/50">Receipt</span>
                      </td>
                      <td className={`whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums ${p.voided ? "line-through" : ""}`}>
                        {rupees(p.amount)}
                      </td>
                      <td className="px-4 py-3">{p.method || "—"}</td>
                      <td className="px-4 py-3 text-foreground/70">
                        {p.note || "—"}
                        {p.voided && p.voidReason && <span className="block text-xs">Cancelled: {p.voidReason}</span>}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-foreground/60">
                        {p.createdBy}<span className="block">{p.createdAt}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>
          )}
        </Section>

        <Section title="Activity history">
          {audit.length === 0 ? (
            <Empty>No recorded changes yet. Changes made from now on appear here.</Empty>
          ) : (
            <ol className="divide-y divide-foreground/10">
              {audit.map((a) => (
                <li key={a.id} className="px-4 py-3 text-sm">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                    <p>
                      <span className="mr-2 rounded bg-foreground/5 px-1.5 py-0.5 text-[11px] font-bold uppercase text-foreground/60">
                        {a.entity} {a.action}
                      </span>
                      {a.summary}
                    </p>
                    <p className="text-xs text-foreground/60">
                      <span className="font-semibold text-foreground">{a.actor}</span> · {a.at}
                    </p>
                  </div>
                  {a.changes && a.action === "updated" && (
                    <ul className="mt-1.5 space-y-0.5 text-xs text-foreground/70">
                      {Object.entries(a.changes).map(([field, c]) => (
                        <li key={field}>
                          <span className="font-semibold">{field}:</span>{" "}
                          <span className="line-through decoration-foreground/40">{show(c.from)}</span> →{" "}
                          <span className="font-medium text-foreground">{show(c.to)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ol>
          )}
        </Section>
      </main>
    </>
  );
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

const show = (v: unknown) => (v === null || v === undefined || v === "" ? "(empty)" : String(v));

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-8 rounded-xl border border-foreground/10">
      <h2 className="border-b border-foreground/10 px-4 py-3 text-sm font-bold">{title}</h2>
      {children}
    </section>
  );
}

function Th({ children, right }: { children: ReactNode; right?: boolean }) {
  return <th className={`px-4 py-2.5 font-semibold ${right ? "text-right" : ""}`}>{children}</th>;
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="px-4 py-8 text-center text-sm text-foreground/60">{children}</p>;
}
