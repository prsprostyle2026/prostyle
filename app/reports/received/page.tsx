import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { displayDate } from "@/app/bill/BillSheet";
import { requireUser } from "@/lib/auth";
import { money } from "@/lib/format";
import { defaultPeriod } from "@/lib/gst-report";
import { getReceivedReport, NOT_RECORDED, type Receipt } from "@/lib/received-report";
import { RECEIVERS } from "@/lib/receivers";
import DateRangeForm from "../../components/DateRangeForm";
import StaffBar from "../../components/StaffBar";
import StatTiles from "../../components/StatTiles";

export const metadata: Metadata = {
  title: "Received by report — Prostyle Sports Wear",
  robots: { index: false, follow: false },
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const FILTERS: string[] = [...RECEIVERS, NOT_RECORDED];

export default function ReceivedReportPage({ searchParams }: PageProps<"/reports/received">) {
  return (
    <Suspense fallback={<p className="p-8 text-center text-sm text-foreground/60">Loading…</p>}>
      <ReceivedContent searchParams={searchParams} />
    </Suspense>
  );
}

async function ReceivedContent({ searchParams }: { searchParams: PageProps<"/reports/received">["searchParams"] }) {
  const user = await requireUser();
  const sp = await searchParams;
  const d = defaultPeriod();
  const from = typeof sp.from === "string" && DATE_RE.test(sp.from) ? sp.from : d.from;
  const to = typeof sp.to === "string" && DATE_RE.test(sp.to) ? sp.to : d.to;
  const by = typeof sp.by === "string" && FILTERS.includes(sp.by) ? sp.by : "";
  const r = await getReceivedReport(from, to, by);
  const qs = new URLSearchParams({ from, to, ...(by && { by }) }).toString();

  const tiles = [
    ...r.totals.map((t) => ({ label: `${t.name} (${t.count} ${t.count === 1 ? "payment" : "payments"})`, value: `₹${money(t.amount)}` })),
    ...(r.totals.length > 1 ? [{ label: `Total (${r.grand.count})`, value: `₹${money(r.grand.amount)}`, strong: true }] : []),
  ];

  return (
    <>
      <StaffBar user={user} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <h1 className="text-2xl font-black uppercase italic tracking-tight">Received by</h1>
        <p className="mt-1 text-sm text-foreground/60">
          Money taken on bills and separate payments, by who received it. Cancelled entries are listed for the record
          but not counted. Open &ldquo;History&rdquo; on any entry to see who created and changed it.
        </p>

        <DateRangeForm
          from={from}
          to={to}
          fields={
            <label className="col-span-2 min-w-0 space-y-1 sm:col-span-1">
              <span className="block text-xs font-medium text-foreground/70">Received by</span>
              <select name="by" defaultValue={by} className="w-full rounded-md border border-foreground/15 bg-background px-3 py-2 text-sm">
                <option value="">Everyone</option>
                {FILTERS.map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </select>
            </label>
          }
        >
          <a
            href={`/reports/received/export?${qs}`}
            className="flex-1 rounded-md bg-accent px-3 py-2.5 text-center text-sm font-bold text-accent-foreground hover:bg-accent-hover sm:flex-none sm:py-2"
          >
            Download CSV
          </a>
        </DateRangeForm>

        <StatTiles tiles={tiles} />

        <section className="mt-8 rounded-xl border border-foreground/10">
          <h2 className="border-b border-foreground/10 px-4 py-3 text-sm font-bold">
            Transactions ({r.receipts.length}) · {displayDate(from)} – {displayDate(to)}
          </h2>
          {r.receipts.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-foreground/60">No payments received in this period.</p>
          ) : (
            <ul className="divide-y divide-foreground/10">
              {r.receipts.map((x) => (
                <ReceiptRow key={`${x.kind}:${x.id}`} r={x} />
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}

function ReceiptRow({ r }: { r: Receipt }) {
  const href = r.kind === "bill" ? `/bills/${r.id}` : `/payments/${r.id}`;
  return (
    <li className={`px-4 py-3 text-sm ${r.voided ? "bg-danger/5" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-1">
        <div className="min-w-0">
          <p className="flex flex-wrap items-baseline gap-x-2">
            <Link href={href} className="font-semibold hover:text-accent-ink hover:underline">
              {r.kind === "bill" ? `${r.docType} ${r.ref}` : "Payment"}
            </Link>
            <span className="text-foreground/60">{displayDate(r.date)}</span>
            {r.voided && (
              <span className="rounded bg-danger/10 px-1.5 py-0.5 text-[11px] font-bold uppercase text-danger">Cancelled</span>
            )}
          </p>
          <p className="mt-0.5">
            <Link href={`/customers/${r.customerId}`} className="hover:text-accent-ink hover:underline">
              {r.customerName}
            </Link>
            {r.detail && <span className="text-foreground/60"> · {r.detail}</span>}
          </p>
          {r.voided && r.voidReason && <p className="mt-0.5 text-xs text-danger">Reason: {r.voidReason}</p>}
        </div>
        <div className="ml-auto text-right">
          <p className={`text-base font-bold tabular-nums ${r.voided ? "text-foreground/50 line-through" : ""}`}>₹{money(r.amount)}</p>
          <p className="text-xs">
            Received by{" "}
            <span className={`font-semibold ${r.receivedBy === NOT_RECORDED ? "text-foreground/50" : "text-accent-ink"}`}>
              {r.receivedBy}
            </span>
          </p>
        </div>
      </div>
      <details className="mt-1.5 text-xs">
        <summary className="cursor-pointer select-none text-foreground/60 hover:text-foreground">
          History ({r.audit.length}) · recorded by <span className="font-semibold">{r.recordedBy}</span>, {r.recordedAt}
        </summary>
        {r.audit.length === 0 ? (
          <p className="mt-1.5 text-foreground/60">No history recorded for this entry.</p>
        ) : (
          <ol className="mt-1.5 space-y-1.5 border-l-2 border-gold/40 pl-3">
            {r.audit.map((a, i) => (
              <li key={i}>
                <p>
                  <span className="mr-1.5 rounded bg-foreground/5 px-1.5 py-0.5 text-[10px] font-bold uppercase text-foreground/60">
                    {a.action}
                  </span>
                  {a.summary}
                </p>
                <p className="text-foreground/60">
                  <span className="font-semibold text-foreground">{a.actor}</span> · {a.at}
                </p>
                {a.changes && a.action === "updated" && (
                  <ul className="mt-0.5 text-foreground/70">
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
      </details>
    </li>
  );
}

const show = (v: unknown) => (v === null || v === undefined || v === "" ? "(empty)" : String(v));
