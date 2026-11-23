import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { displayDate } from "@/app/bill/BillSheet";
import { requireUser } from "@/lib/auth";
import { money } from "@/lib/format";
import { defaultPeriod, getGstReport, type RateLine } from "@/lib/gst-report";
import DateRangeForm from "../../components/DateRangeForm";
import StaffBar from "../../components/StaffBar";
import StatTiles from "../../components/StatTiles";

export const metadata: Metadata = {
  title: "GST report — Prostyle Sports Wear",
  robots: { index: false, follow: false },
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default function GstReportPage({ searchParams }: PageProps<"/reports/gst">) {
  return (
    <Suspense fallback={<p className="p-8 text-center text-sm text-foreground/60">Loading…</p>}>
      <GstContent searchParams={searchParams} />
    </Suspense>
  );
}

async function GstContent({ searchParams }: { searchParams: PageProps<"/reports/gst">["searchParams"] }) {
  const user = await requireUser();
  const sp = await searchParams;
  const d = defaultPeriod();
  const from = typeof sp.from === "string" && DATE_RE.test(sp.from) ? sp.from : d.from;
  const to = typeof sp.to === "string" && DATE_RE.test(sp.to) ? sp.to : d.to;
  const r = await getGstReport(from, to);
  const qs = `from=${from}&to=${to}`;
  const tax = r.totals.cgst + r.totals.sgst + r.totals.igst;

  const tiles = [
    { label: `Invoices (${r.totals.b2b} B2B, ${r.totals.count - r.totals.b2b} B2C)`, value: String(r.totals.count) },
    { label: "Invoice value", value: `₹${money(r.totals.invoiceValue)}` },
    { label: "Taxable value", value: `₹${money(r.totals.taxable)}` },
    { label: "Total GST", value: `₹${money(tax)}` },
  ];

  return (
    <>
      <StaffBar user={user} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <h1 className="text-2xl font-black uppercase italic tracking-tight">GST report</h1>
        <p className="mt-1 text-sm text-foreground/60">
          From saved invoices only; cancelled invoices, customer bills, quotations and proformas are left out. Check the
          figures with your accountant before filing.
        </p>

        <DateRangeForm from={from} to={to}>
          <a href={`/reports/gst/export?${qs}&kind=invoices`} className="flex-1 rounded-md bg-accent px-3 py-2.5 text-center text-sm font-bold text-accent-foreground hover:bg-accent-hover sm:flex-none sm:py-2">
            Download invoices CSV
          </a>
          <a href={`/reports/gst/export?${qs}&kind=rates`} className="flex-1 rounded-md border border-foreground/20 px-3 py-2.5 text-center text-sm font-semibold hover:bg-foreground/5 sm:flex-none sm:py-2">
            Rate summary CSV
          </a>
        </DateRangeForm>

        <StatTiles tiles={tiles} />
        <p className="mt-4 text-xs text-foreground/50 md:hidden">Tables below scroll sideways.</p>

        <Section title="Summary by GST rate">
          <RateTable lines={r.byRate} totals={r.totals} />
        </Section>

        <Section title={`B2B invoices — customers with GSTIN (${r.totals.b2b})`}>
          <InvoiceTable invoices={r.invoices.filter((i) => i.gstin)} b2b />
        </Section>

        <Section title="B2C — unregistered customers, by place of supply and rate">
          {r.b2cByState.length === 0 ? (
            <Empty>No B2C sales in this period.</Empty>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="text-xs uppercase tracking-wider text-foreground/60">
                  <tr><Th>Place of supply</Th><Th right>Rate</Th><Th right>Taxable</Th><Th right>CGST</Th><Th right>SGST</Th><Th right>IGST</Th></tr>
                </thead>
                <tbody className="divide-y divide-foreground/10">
                  {r.b2cByState.map((l) => (
                    <tr key={`${l.placeOfSupply}|${l.rate}`}>
                      <Td>{l.placeOfSupply}</Td><Td right>{l.rate}%</Td><Td right>{money(l.taxable)}</Td>
                      <Td right>{money(l.cgst)}</Td><Td right>{money(l.sgst)}</Td><Td right>{money(l.igst)}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        <Section title={`All invoices in the period (${r.totals.count})`}>
          <InvoiceTable invoices={r.invoices} />
        </Section>
        <p className="mt-2 text-xs text-foreground/50">Period: {displayDate(from)} – {displayDate(to)}</p>
      </main>
    </>
  );
}

function RateTable({ lines, totals }: { lines: RateLine[]; totals: { taxable: number; cgst: number; sgst: number; igst: number } }) {
  if (!lines.length) return <Empty>No invoices in this period.</Empty>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead className="text-xs uppercase tracking-wider text-foreground/60">
          <tr><Th>GST rate</Th><Th right>Taxable</Th><Th right>CGST</Th><Th right>SGST</Th><Th right>IGST</Th><Th right>Total tax</Th></tr>
        </thead>
        <tbody className="divide-y divide-foreground/10">
          {lines.map((l) => (
            <tr key={l.rate}>
              <Td>{l.rate}%</Td><Td right>{money(l.taxable)}</Td><Td right>{money(l.cgst)}</Td><Td right>{money(l.sgst)}</Td>
              <Td right>{money(l.igst)}</Td><Td right>{money(l.cgst + l.sgst + l.igst)}</Td>
            </tr>
          ))}
          <tr className="font-bold">
            <Td>Total</Td><Td right>{money(totals.taxable)}</Td><Td right>{money(totals.cgst)}</Td><Td right>{money(totals.sgst)}</Td>
            <Td right>{money(totals.igst)}</Td><Td right>{money(totals.cgst + totals.sgst + totals.igst)}</Td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function InvoiceTable({ invoices, b2b }: { invoices: Awaited<ReturnType<typeof getGstReport>>["invoices"]; b2b?: boolean }) {
  if (!invoices.length) return <Empty>None in this period.</Empty>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead className="text-xs uppercase tracking-wider text-foreground/60">
          <tr>
            <Th>Invoice</Th><Th>Date</Th><Th>Customer</Th>{b2b && <Th>GSTIN</Th>}<Th>Place of supply</Th>
            <Th right>Rate</Th><Th right>Taxable</Th><Th right>CGST</Th><Th right>SGST</Th><Th right>IGST</Th><Th right>Invoice value</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-foreground/10">
          {invoices.flatMap((inv) =>
            (inv.rates.length ? inv.rates : [{ rate: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0 }]).map((l, i) => (
              <tr key={`${inv.id}-${l.rate}`} className={i ? "text-foreground/80" : ""}>
                <Td>{i === 0 && <Link href={`/bills/${inv.id}`} className="font-semibold hover:text-accent-ink hover:underline">{inv.number}</Link>}</Td>
                <Td>{i === 0 && displayDate(inv.date)}</Td>
                <Td>{i === 0 && inv.customerName}</Td>
                {b2b && <Td>{i === 0 && <span className="font-mono text-xs">{inv.gstin}</span>}</Td>}
                <Td>{i === 0 && inv.placeOfSupply}</Td>
                <Td right>{l.rate}%</Td><Td right>{money(l.taxable)}</Td><Td right>{money(l.cgst)}</Td>
                <Td right>{money(l.sgst)}</Td><Td right>{money(l.igst)}</Td>
                <Td right>{i === 0 && money(inv.invoiceValue)}</Td>
              </tr>
            )),
          )}
        </tbody>
      </table>
    </div>
  );
}

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
function Td({ children, right }: { children?: ReactNode; right?: boolean }) {
  return <td className={`whitespace-nowrap px-4 py-2.5 ${right ? "text-right tabular-nums" : ""}`}>{children}</td>;
}
function Empty({ children }: { children: ReactNode }) {
  return <p className="px-4 py-8 text-center text-sm text-foreground/60">{children}</p>;
}
