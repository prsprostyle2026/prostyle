import "server-only";
import { query } from "./db";

// Read queries for the customer, bills and payment pages. Times are shown in India time.
const IST = (col: string) => `to_char(${col} AT TIME ZONE 'Asia/Kolkata', 'DD Mon YYYY, HH12:MI AM')`;
const DAY = (col: string) => `to_char(${col}, 'DD Mon YYYY')`;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type CustomerSummary = {
  id: string;
  name: string;
  gstin: string;
  phone: string;
  email: string;
  details: string;
  placeOfSupply: string;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
  billed: number;
  paidOnBills: number;
  payments: number;
  pending: number;
  billCount: number; // invoices + customer bills
  invoiceCount: number;
  customerBillCount: number;
  openingBalance: number; // + owes us, - credit
  openingDate: string | null; // yyyy-mm-dd
  openingNote: string;
  firstEntryDate: string | null; // earliest bill or payment; the opening balance must be dated on or before it
};

export async function getCustomerSummary(id: string): Promise<CustomerSummary | null> {
  if (!UUID_RE.test(id)) return null;
  const { rows } = await query<CustomerSummary>(
    `SELECT c.id, c.name, c.gstin, c.phone, c.email, c.details, c.place_of_supply AS "placeOfSupply",
            c.created_by AS "createdBy", ${IST("c.created_at")} AS "createdAt",
            c.updated_by AS "updatedBy", ${IST("c.updated_at")} AS "updatedAt",
            b.billed::float8 AS billed, b.paid_on_bills::float8 AS "paidOnBills",
            b.payments::float8 AS payments, b.pending::float8 AS pending, b.bill_count AS "billCount",
            b.invoice_count AS "invoiceCount", b.customer_bill_count AS "customerBillCount",
            c.opening_balance::float8 AS "openingBalance", to_char(c.opening_balance_date, 'YYYY-MM-DD') AS "openingDate",
            c.opening_balance_note AS "openingNote",
            to_char((SELECT min(entry_date) FROM customer_ledger_entries e WHERE e.customer_id = c.id AND e.kind <> 'opening'),
                    'YYYY-MM-DD') AS "firstEntryDate"
     FROM customers c JOIN customer_balances b ON b.customer_id = c.id
     WHERE c.id = $1`,
    [id],
  );
  return rows[0] ?? null;
}

export type BillRow = {
  id: string;
  docType: "Quotation" | "Proforma Invoice" | "Invoice" | "Customer Bill";
  number: string;
  billDate: string;
  dueDate: string | null;
  customerId: string;
  customerName: string;
  items: { name: string; hsn: string; rate: number; qty: number; gst: number }[];
  taxable: number;
  tax: number;
  total: number;
  paid: number;
  balanceAfter: number | null; // customer's balance after this entry; null if it doesn't count
  paymentNote: string;
  createdBy: string;
  createdAt: string;
  updatedBy: string | null;
  voided: boolean;
  voidReason: string | null;
  convertedTo: string | null; // number of the active invoice/bill made from this quotation/proforma
};

const BILL_COLUMNS = `b.id, b.doc_type AS "docType", b.number, ${DAY("b.bill_date")} AS "billDate", ${DAY("b.due_date")} AS "dueDate",
  b.customer_id AS "customerId", coalesce(c.name, b.customer->>'name') AS "customerName", b.items,
  b.taxable::float8 AS taxable, b.tax::float8 AS tax, b.total::float8 AS total, b.paid::float8 AS paid,
  l.balance::float8 AS "balanceAfter", b.payment_note AS "paymentNote",
  b.created_by AS "createdBy", ${IST("b.created_at")} AS "createdAt", b.updated_by AS "updatedBy",
  b.voided_at IS NOT NULL AS voided, b.void_reason AS "voidReason",
  (SELECT t.number FROM bills t WHERE t.converted_from = b.id AND t.voided_at IS NULL LIMIT 1) AS "convertedTo"`;

const BILL_FROM = `bills b
  LEFT JOIN customers c ON c.id = b.customer_id
  LEFT JOIN customer_ledger l ON l.entry_id = b.id AND l.kind = 'bill'`;

export async function getCustomerBills(customerId: string): Promise<BillRow[]> {
  const { rows } = await query<BillRow>(
    `SELECT ${BILL_COLUMNS} FROM ${BILL_FROM}
     WHERE b.customer_id = $1 ORDER BY b.bill_date DESC, b.created_at DESC`,
    [customerId],
  );
  return rows;
}

// Documents across all customers in a date range (the bills dashboard), newest first.
export async function getRecentBills(from: string, to: string, limit = 2000): Promise<BillRow[]> {
  const { rows } = await query<BillRow>(
    `SELECT ${BILL_COLUMNS} FROM ${BILL_FROM}
     WHERE b.bill_date BETWEEN $1 AND $2
     ORDER BY b.bill_date DESC, b.created_at DESC LIMIT $3`,
    [from, to, limit],
  );
  return rows;
}

export type BillStats = {
  billCount: number;
  billed: number;
  collected: number; // paid on bills + separate payments
  outstanding: number; // sum of positive customer balances
  billedThisMonth: number;
  billsThisMonth: number;
};

// Sales figures count only Invoices and Customer Bills that aren't cancelled.
// billed/collected/billCount cover the given date range; outstanding is as of now.
export async function getBillStats(from: string, to: string): Promise<BillStats> {
  const { rows } = await query<BillStats>(
    `WITH sales AS (
       SELECT * FROM bills WHERE doc_type IN ('Invoice', 'Customer Bill') AND voided_at IS NULL
     )
     SELECT
       (SELECT count(*)::int FROM sales WHERE bill_date BETWEEN $1 AND $2) AS "billCount",
       (SELECT coalesce(sum(total), 0)::float8 FROM sales WHERE bill_date BETWEEN $1 AND $2) AS billed,
       ((SELECT coalesce(sum(paid), 0) FROM sales WHERE bill_date BETWEEN $1 AND $2)
        + (SELECT coalesce(sum(amount), 0) FROM customer_payments WHERE voided_at IS NULL AND paid_on BETWEEN $1 AND $2))::float8
         AS collected,
       (SELECT coalesce(sum(pending) FILTER (WHERE pending > 0), 0)::float8 FROM customer_balances) AS outstanding,
       (SELECT coalesce(sum(total), 0)::float8 FROM sales
         WHERE date_trunc('month', bill_date) = date_trunc('month', now() AT TIME ZONE 'Asia/Kolkata')) AS "billedThisMonth",
       (SELECT count(*)::int FROM sales
         WHERE date_trunc('month', bill_date) = date_trunc('month', now() AT TIME ZONE 'Asia/Kolkata')) AS "billsThisMonth"`,
    [from, to],
  );
  return rows[0];
}

export type PaymentRow = {
  id: string;
  amount: number;
  paidOn: string;
  method: string;
  note: string;
  createdBy: string;
  createdAt: string;
  voided: boolean;
  voidReason: string | null;
};

export async function getCustomerPayments(customerId: string): Promise<PaymentRow[]> {
  const { rows } = await query<PaymentRow>(
    `SELECT id, amount::float8 AS amount, ${DAY("paid_on")} AS "paidOn", method, note,
            created_by AS "createdBy", ${IST("created_at")} AS "createdAt",
            voided_at IS NOT NULL AS voided, void_reason AS "voidReason"
     FROM customer_payments WHERE customer_id = $1 ORDER BY paid_on DESC, created_at DESC`,
    [customerId],
  );
  return rows;
}

export type AuditRow = {
  id: string;
  entity: string;
  action: string;
  summary: string;
  changes: Record<string, { from: unknown; to: unknown }> | null;
  actor: string;
  at: string;
};

export async function getCustomerAudit(customerId: string): Promise<AuditRow[]> {
  const { rows } = await query<AuditRow>(
    `SELECT id::text, entity, action, summary, changes, actor, ${IST("at")} AS at
     FROM audit_log WHERE customer_id = $1 ORDER BY at DESC, id DESC LIMIT 500`,
    [customerId],
  );
  return rows;
}
