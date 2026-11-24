import "server-only";
import type { DocItem } from "@/app/bill/calc";
import { DEFAULT_BUSINESS, DEFAULT_SIGNATURE, type Business, type DocCustomer, type DocType } from "@/app/bill/docTypes";
import { query } from "./db";

// Read queries for saved documents and customer ledgers.
// Dates are formatted in SQL (yyyy-mm-dd) so they never shift with the server timezone.
const IST = (col: string) => `to_char(${col} AT TIME ZONE 'Asia/Kolkata', 'DD Mon YYYY, HH12:MI AM')`;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (s: unknown): s is string => typeof s === "string" && UUID_RE.test(s);

export type DocLink = { id: string; number: string; docType: DocType; voided: boolean };

export type DocRecord = {
  id: string;
  docType: DocType;
  number: string;
  financialYear: string | null;
  date: string;
  dueDate: string;
  customerId: string;
  customer: DocCustomer;
  items: DocItem[];
  applyGst: boolean;
  roundOff: boolean;
  total: number;
  paid: number;
  paymentNote: string;
  paymentMethod: string | null; // how the paid amount was paid
  receivedBy: string | null; // staff-only; not shown on the document
  business: Business;
  signature: string; // resolved: default stamp path, "" for none, or a data URL
  voided: boolean;
  voidReason: string | null;
  voidedBy: string | null;
  voidedAt: string | null;
  createdBy: string;
  createdAt: string;
  updatedBy: string | null;
  updatedAt: string | null;
  convertedFrom: DocLink | null;
  convertedTo: DocLink[];
};

type Row = Omit<DocRecord, "business" | "signature" | "convertedFrom" | "convertedTo"> & {
  business: Business | null;
  signature: string | null;
  srcId: string | null;
  srcNumber: string | null;
  srcType: DocType | null;
  srcVoided: boolean | null;
};

export async function getDocument(id: string): Promise<DocRecord | null> {
  if (!isUuid(id)) return null;
  const { rows } = await query<Row>(
    `SELECT b.id, b.doc_type AS "docType", b.number, b.financial_year AS "financialYear",
            to_char(b.bill_date, 'YYYY-MM-DD') AS date, coalesce(to_char(b.due_date, 'YYYY-MM-DD'), '') AS "dueDate",
            b.customer_id AS "customerId", b.customer, b.items, b.apply_gst AS "applyGst", b.round_off AS "roundOff",
            b.total::float8 AS total, b.paid::float8 AS paid, b.payment_note AS "paymentNote", b.received_by AS "receivedBy", b.payment_method AS "paymentMethod",
            b.business, b.signature,
            b.voided_at IS NOT NULL AS voided, b.void_reason AS "voidReason", b.voided_by AS "voidedBy",
            ${IST("b.voided_at")} AS "voidedAt",
            b.created_by AS "createdBy", ${IST("b.created_at")} AS "createdAt",
            b.updated_by AS "updatedBy", ${IST("b.updated_at")} AS "updatedAt",
            s.id AS "srcId", s.number AS "srcNumber", s.doc_type AS "srcType", s.voided_at IS NOT NULL AS "srcVoided"
     FROM bills b LEFT JOIN bills s ON s.id = b.converted_from
     WHERE b.id = $1`,
    [id],
  );
  const r = rows[0];
  if (!r) return null;
  const { rows: to } = await query<DocLink>(
    `SELECT id, number, doc_type AS "docType", voided_at IS NOT NULL AS voided
     FROM bills WHERE converted_from = $1 ORDER BY created_at`,
    [id],
  );
  const { srcId, srcNumber, srcType, srcVoided, ...rest } = r;
  return {
    ...rest,
    business: { ...DEFAULT_BUSINESS, ...(r.business ?? {}) },
    signature: r.signature === null ? DEFAULT_SIGNATURE : r.signature,
    convertedFrom: srcId ? { id: srcId, number: srcNumber!, docType: srcType!, voided: !!srcVoided } : null,
    convertedTo: to,
  };
}

// The customer's balance just before this document (what a Customer Bill prints as
// "Previous Balance"). Worked out from the ledger, so it stays right after edits and voids.
export async function getBalanceBefore(docId: string): Promise<number> {
  const { rows } = await query<{ before: number }>(
    `SELECT coalesce(sum(e.debit - e.credit), 0)::float8 AS before
     FROM bills b JOIN customer_ledger_entries e ON e.customer_id = b.customer_id
     WHERE b.id = $1 AND (e.entry_date, e.created_at, e.entry_id) < (b.bill_date, b.created_at, b.id)`,
    [docId],
  );
  return rows[0]?.before ?? 0;
}

export async function getPendingBalance(customerId: string): Promise<number> {
  const { rows } = await query<{ pending: number }>(
    "SELECT pending::float8 AS pending FROM customer_balances WHERE customer_id = $1",
    [customerId],
  );
  return rows[0]?.pending ?? 0;
}

export type LedgerRow = {
  kind: "bill" | "payment" | "opening";
  entryId: string;
  docType: DocType | null;
  ref: string;
  date: string;
  debit: number;
  credit: number;
  note: string;
  balance: number;
};

// Statement for a date range: balance brought forward, then each entry with its running balance.
export async function getStatement(customerId: string, from: string, to: string) {
  const [opening, entries] = await Promise.all([
    query<{ opening: number }>(
      `SELECT coalesce(sum(debit - credit), 0)::float8 AS opening
       FROM customer_ledger_entries WHERE customer_id = $1 AND entry_date < $2`,
      [customerId, from],
    ),
    query<LedgerRow>(
      `SELECT kind, entry_id AS "entryId", doc_type AS "docType", ref, to_char(entry_date, 'YYYY-MM-DD') AS date,
              debit::float8 AS debit, credit::float8 AS credit, note, balance::float8 AS balance
       FROM customer_ledger WHERE customer_id = $1 AND entry_date BETWEEN $2 AND $3
       ORDER BY entry_date, created_at, entry_id`,
      [customerId, from, to],
    ),
  ]);
  return { opening: opening.rows[0].opening, entries: entries.rows };
}

export type PaymentRecord = {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  amount: number;
  paidOn: string;
  method: string;
  note: string;
  createdBy: string;
  createdAt: string;
  voided: boolean;
  voidReason: string | null;
  voidedBy: string | null;
  voidedAt: string | null;
  balanceAfter: number | null; // null when voided
};

export async function getPayment(id: string): Promise<PaymentRecord | null> {
  if (!isUuid(id)) return null;
  const { rows } = await query<PaymentRecord>(
    `SELECT p.id, p.customer_id AS "customerId", c.name AS "customerName", c.phone AS "customerPhone",
            p.amount::float8 AS amount, to_char(p.paid_on, 'YYYY-MM-DD') AS "paidOn", p.method, p.note,
            p.created_by AS "createdBy", ${IST("p.created_at")} AS "createdAt",
            p.voided_at IS NOT NULL AS voided, p.void_reason AS "voidReason", p.voided_by AS "voidedBy",
            ${IST("p.voided_at")} AS "voidedAt", l.balance::float8 AS "balanceAfter"
     FROM customer_payments p
     JOIN customers c ON c.id = p.customer_id
     LEFT JOIN customer_ledger l ON l.entry_id = p.id AND l.kind = 'payment'
     WHERE p.id = $1`,
    [id],
  );
  return rows[0] ?? null;
}

// Short printable receipt number from a payment id.
export const receiptNumber = (id: string) => `RCPT-${id.slice(0, 8).toUpperCase()}`;
