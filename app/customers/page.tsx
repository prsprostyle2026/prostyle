import type { Metadata } from "next";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { query } from "@/lib/db";
import StaffBar from "../components/StaffBar";
import CustomersDashboard, { type DashboardCustomer, type Stats } from "./CustomersDashboard";

export const metadata: Metadata = {
  title: "Customers — Prostyle Sports Wear",
  robots: { index: false, follow: false },
};

export default function CustomersPage() {
  return (
    <Suspense fallback={<p className="p-8 text-center text-sm text-foreground/60">Loading…</p>}>
      <CustomersContent />
    </Suspense>
  );
}

async function CustomersContent() {
  const me = await requireUser();
  const [list, stats] = await Promise.all([
    query<DashboardCustomer>(
      `SELECT c.id, c.name, c.gstin, c.phone, c.email, c.details, c.place_of_supply AS "placeOfSupply",
              to_char(c.created_at, 'DD Mon YYYY') AS added, b.pending::float8 AS pending
       FROM customers c JOIN customer_balances b ON b.customer_id = c.id
       ORDER BY lower(c.name)`,
    ),
    query<Stats>(
      `SELECT count(*)::int AS total,
              count(*) FILTER (WHERE c.created_at > now() - interval '30 days')::int AS "newLast30",
              count(*) FILTER (WHERE b.pending > 0)::int AS "withPending",
              coalesce(sum(b.pending) FILTER (WHERE b.pending > 0), 0)::float8 AS "totalPending"
       FROM customers c JOIN customer_balances b ON b.customer_id = c.id`,
    ),
  ]);

  return (
    <>
      <StaffBar user={me} />
      <CustomersDashboard customers={list.rows} stats={stats.rows[0]} />
    </>
  );
}
