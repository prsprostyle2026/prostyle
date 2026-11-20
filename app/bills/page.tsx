import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { financialYear } from "@/app/bill/docTypes";
import { requireUser } from "@/lib/auth";
import { getBillStats, getRecentBills } from "@/lib/customer-data";
import { rupees } from "@/lib/format";
import DateRangeForm from "../components/DateRangeForm";
import StaffBar from "../components/StaffBar";
import StatTiles from "../components/StatTiles";
import BillsTable from "./BillsTable";

export const metadata: Metadata = {
  title: "Bills — Prostyle Sports Wear",
  robots: { index: false, follow: false },
};

const LIMIT = 2000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default function BillsPage({ searchParams }: PageProps<"/bills">) {
  return (
    <Suspense fallback={<p className="p-8 text-center text-sm text-foreground/60">Loading…</p>}>
      <BillsContent searchParams={searchParams} />
    </Suspense>
  );
}

async function BillsContent({ searchParams }: { searchParams: PageProps<"/bills">["searchParams"] }) {
  const me = await requireUser();
  const sp = await searchParams;
  // Default range: this financial year to date (India time).
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
  const from = typeof sp.from === "string" && DATE_RE.test(sp.from) ? sp.from : `${financialYear(today).slice(0, 4)}-04-01`;
  const to = typeof sp.to === "string" && DATE_RE.test(sp.to) ? sp.to : today;
  const [bills, stats] = await Promise.all([getRecentBills(from, to, LIMIT), getBillStats(from, to)]);

  const tiles = [
    { label: "Outstanding now (all customers)", value: rupees(stats.outstanding), strong: stats.outstanding > 0 },
    { label: `Billed this month (${stats.billsThisMonth})`, value: rupees(stats.billedThisMonth) },
    { label: `Billed in range (${stats.billCount})`, value: rupees(stats.billed) },
    { label: "Collected in range", value: rupees(stats.collected) },
  ];

  return (
    <>
      <StaffBar user={me} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black uppercase italic tracking-tight">Bills</h1>
            <p className="mt-1 text-sm text-foreground/60">
              All saved quotations, proformas, invoices and customer bills. Only invoices and customer bills that aren&apos;t
              cancelled count as sales and toward balances.
            </p>
          </div>
          <Link href="/bill" className="rounded-lg bg-accent px-4 py-2.5 text-sm font-bold text-white hover:bg-accent-hover">
            + Create bill
          </Link>
        </div>

        <DateRangeForm from={from} to={to} />

        <StatTiles tiles={tiles} />

        <BillsTable bills={bills} />
        {bills.length === LIMIT && (
          <p className="mt-2 text-xs text-foreground/50">Showing the latest {LIMIT}. Narrow the date range to see older ones.</p>
        )}
      </main>
    </>
  );
}
