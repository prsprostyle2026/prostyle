"use server";

import { redirect } from "next/navigation";
import { diff, writeAudit } from "@/lib/audit";
import { requireUser } from "@/lib/auth";
import { query, withTransaction, type PoolClient } from "@/lib/db";
import { isUuid } from "@/lib/documents";
import { rupees } from "@/lib/format";
import { computeTotals, type DocItem } from "./calc";
import {
  DEFAULT_SIGNATURE,
  NUMBER_PREFIX,
  financialYear,
  formatDocNumber,
  isBillingType,
  isDocType,
  isOfferType,
  type Business,
  type DocCustomer,
  type DocType,
} from "./docTypes";

export type CustomerBalance = { pending: number; invoices: number; customerBills: number };

// Pending balance = (Invoices + Customer Bills) − paid on them − separate payments, ignoring voided ones.
export async function getCustomerBalance(customerId: string): Promise<CustomerBalance> {
  await requireUser();
  const none = { pending: 0, invoices: 0, customerBills: 0 };
  if (!isUuid(customerId)) return none;
  const { rows } = await query<{ pending: string; invoices: number; customerBills: number }>(
    `SELECT pending, invoice_count AS invoices, customer_bill_count AS "customerBills"
     FROM customer_balances WHERE customer_id = $1`,
    [customerId],
  );
  return rows[0] ? { ...rows[0], pending: Number(rows[0].pending) } : none;
}

export type DocInput = {
  docType: DocType;
  date: string;
  dueDate: string;
  customerId: string;
  customer: DocCustomer;
  items: DocItem[];
  applyGst: boolean;
  roundOff: boolean;
  paid: number;
  paymentNote: string;
  business: Business;
  signature: string; // default stamp path, "" for none, or an image data URL
};

export type SaveDocResult = { ok: true; id: string; number: string } | { ok: false; error: string };
type Failure = Extract<SaveDocResult, { ok: false }>;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const str = (v: unknown, max = 500) => String(v ?? "").trim().slice(0, max);
const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 && n < 1e10 ? Math.round(n * 100) / 100 : null;
};

type Clean = {
  docType: DocType;
  date: string;
  dueDate: string | null;
  customerId: string;
  customer: DocCustomer;
  items: DocItem[];
  applyGst: boolean;
  roundOff: boolean;
  paid: number;
  paymentNote: string;
  business: Business;
  signature: string | null; // null = default stamp
  taxable: number;
  tax: number;
  total: number;
};

// Checks the input and works out the totals on the server.
function clean(input: DocInput): Clean | Failure {
  if (!isDocType(input.docType)) return { ok: false, error: "Unknown document type." };
  if (!isUuid(input.customerId)) return { ok: false, error: "Pick a saved customer first." };
  if (!DATE_RE.test(String(input.date))) return { ok: false, error: "Enter the document date." };
  const items: DocItem[] = [];
  for (const i of Array.isArray(input.items) ? input.items : []) {
    const name = str(i?.name, 200);
    if (!name) continue;
    const rate = num(i.rate), qty = num(i.qty), gst = num(i.gst);
    if (rate === null || qty === null || gst === null || gst > 100) {
      return { ok: false, error: `Check the rate, quantity and GST % of "${name}".` };
    }
    items.push({ name, hsn: str(i.hsn, 20), rate, qty, gst });
  }
  if (!items.length || items.length > 500) return { ok: false, error: "Add at least one item." };
  const paid = num(input.paid);
  if (paid === null) return { ok: false, error: "The amount paid is not a valid number." };

  const c = input.customer ?? ({} as DocCustomer);
  const customer: DocCustomer = {
    name: str(c.name, 200),
    gstin: str(c.gstin, 15).toUpperCase(),
    phone: str(c.phone, 30),
    email: str(c.email, 200),
    details: str(c.details, 1000),
    placeOfSupply: str(c.placeOfSupply, 80) || "29-KARNATAKA",
  };
  if (!customer.name) return { ok: false, error: "Enter the customer name." };

  const b = input.business ?? ({} as Business);
  const business = Object.fromEntries(
    (Object.keys(b) as (keyof Business)[]).map((k) => [k, str(b[k], 300)]),
  ) as Business;

  let signature: string | null = String(input.signature ?? "");
  if (signature === DEFAULT_SIGNATURE) signature = null;
  else if (signature && !/^data:image\/(png|jpe?g|gif|webp);base64,/.test(signature)) {
    return { ok: false, error: "The signature must be an image." };
  } else if (signature.length > 700_000) {
    return { ok: false, error: "The signature image is too large. Use one under 500 KB." };
  }

  const applyGst = Boolean(input.applyGst);
  const roundOff = Boolean(input.roundOff);
  const t = computeTotals({ items, applyGst, roundOff, placeOfSupply: customer.placeOfSupply, sellerGstin: business.gstin });
  return {
    docType: input.docType,
    date: input.date,
    dueDate: DATE_RE.test(String(input.dueDate)) ? input.dueDate : null,
    customerId: input.customerId,
    customer,
    items,
    applyGst,
    roundOff,
    paid,
    paymentNote: str(input.paymentNote, 200),
    business,
    signature,
    taxable: t.taxableTotal,
    tax: t.taxTotal,
    total: t.total,
  };
}

// Next number for this type and financial year, e.g. INV/2026-27/004. The counter row is
// updated inside the caller's transaction, so a failed save doesn't use up a number.
// The first number of a year continues after any old-style numbers (INV-1, INV-2…) in that year.
async function nextNumber(db: PoolClient, docType: DocType, fy: string) {
  const start = Number(fy.slice(0, 4));
  const { rows } = await db.query<{ seq: number }>(
    `INSERT INTO doc_counters (doc_type, financial_year, last_seq)
     VALUES ($1, $2, (SELECT coalesce(max(substring(number FROM '^' || $3 || '-(\\d+)$')::int), 0) + 1
                      FROM bills WHERE doc_type = $1 AND financial_year IS NULL AND bill_date BETWEEN $4 AND $5))
     ON CONFLICT (doc_type, financial_year) DO UPDATE SET last_seq = doc_counters.last_seq + 1
     RETURNING last_seq AS seq`,
    [docType, fy, NUMBER_PREFIX[docType], `${start}-04-01`, `${start + 1}-03-31`],
  );
  const seq = rows[0].seq;
  return { seq, number: formatDocNumber(docType, fy, seq) };
}

// Create a new document, or (with convertFromId) turn a quotation/proforma into an invoice/bill.
export async function createDocument(input: DocInput, convertFromId?: string | null): Promise<SaveDocResult> {
  const actor = await requireUser();
  const d = clean(input);
  if ("ok" in d) return d;
  if (convertFromId && !isBillingType(d.docType)) {
    return { ok: false, error: "A quotation or proforma can only be converted into an invoice or customer bill." };
  }

  return withTransaction(async (db): Promise<SaveDocResult> => {
    const found = await db.query("SELECT 1 FROM customers WHERE id = $1 FOR UPDATE", [d.customerId]);
    if (!found.rowCount) return { ok: false, error: "This customer no longer exists. Pick them again." };

    let source: { id: string; number: string; doc_type: DocType } | null = null;
    if (convertFromId) {
      const src = await db.query<{ id: string; number: string; doc_type: DocType; customer_id: string; voided_at: Date | null }>(
        "SELECT id, number, doc_type, customer_id, voided_at FROM bills WHERE id = $1 FOR UPDATE",
        [convertFromId],
      );
      const s = src.rows[0];
      if (!s || !isOfferType(s.doc_type)) return { ok: false, error: "Only quotations and proformas can be converted." };
      if (s.voided_at) return { ok: false, error: `${s.doc_type} ${s.number} is cancelled, so it can't be converted.` };
      if (s.customer_id !== d.customerId) return { ok: false, error: "A converted document keeps the original customer." };
      const done = await db.query<{ number: string }>(
        "SELECT number FROM bills WHERE converted_from = $1 AND voided_at IS NULL",
        [s.id],
      );
      if (done.rows[0]) return { ok: false, error: `${s.number} was already converted to ${done.rows[0].number}.` };
      source = s;
    }

    const fy = financialYear(d.date);
    const { seq, number } = await nextNumber(db, d.docType, fy);
    const previousBalance = await db.query<{ pending: string }>(
      "SELECT pending FROM customer_balances WHERE customer_id = $1",
      [d.customerId],
    );
    const { rows } = await db.query<{ id: string }>(
      `INSERT INTO bills (doc_type, number, financial_year, seq, customer_id, bill_date, due_date, customer, items,
                          apply_gst, round_off, taxable, tax, total, paid, previous_balance, payment_note,
                          business, signature, converted_from, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21) RETURNING id`,
      [
        d.docType, number, fy, seq, d.customerId, d.date, d.dueDate, JSON.stringify(d.customer), JSON.stringify(d.items),
        d.applyGst, d.roundOff, d.taxable, d.tax, d.total, d.paid, Number(previousBalance.rows[0]?.pending ?? 0),
        d.paymentNote, JSON.stringify(d.business), d.signature, source?.id ?? null, actor,
      ],
    );
    await writeAudit(db, {
      customerId: d.customerId,
      entity: "bill",
      entityId: rows[0].id,
      action: source ? "converted" : "created",
      summary:
        `${d.docType} ${number} for ${rupees(d.total)}${d.paid > 0 ? `, paid ${rupees(d.paid)}` : ""}` +
        (source ? ` (converted from ${source.doc_type} ${source.number})` : ""),
      actor,
    });
    return { ok: true, id: rows[0].id, number };
  });
}

// What the activity history shows when a document is edited.
function auditView(d: {
  date: string; dueDate: string | null; total: number; paid: number; paymentNote: string; applyGst: boolean;
  items: DocItem[]; customer: DocCustomer;
}) {
  return {
    date: d.date,
    dueDate: d.dueDate ?? "",
    total: rupees(d.total),
    paid: rupees(d.paid),
    paymentNote: d.paymentNote,
    gst: d.applyGst ? "applied" : "not applied",
    items: d.items.map((i) => `${i.name} ${i.qty}×${i.rate}${i.gst ? ` @${i.gst}%` : ""}`).join("; "),
    customerName: d.customer.name,
    customerDetails: [d.customer.gstin, d.customer.phone, d.customer.email, d.customer.details].filter(Boolean).join(" · "),
    placeOfSupply: d.customer.placeOfSupply,
  };
}
const AUDIT_LABELS = {
  date: "Date", dueDate: "Due date", total: "Total", paid: "Paid", paymentNote: "Payment note", gst: "GST",
  items: "Items", customerName: "Customer name", customerDetails: "Customer details", placeOfSupply: "Place of supply",
} as const;

// Edit a saved document. The type, number and customer stay fixed; the date must stay in
// the same financial year so the number still matches it.
export async function updateDocument(id: string, input: DocInput): Promise<SaveDocResult> {
  const actor = await requireUser();
  const d = clean(input);
  if ("ok" in d) return d;
  if (!isUuid(id)) return { ok: false, error: "This document no longer exists." };

  return withTransaction(async (db): Promise<SaveDocResult> => {
    const { rows } = await db.query<{
      number: string; doc_type: DocType; customer_id: string; financial_year: string | null; voided_at: Date | null;
      date: string; due_date: string | null; total: string; paid: string; payment_note: string; apply_gst: boolean;
      items: DocItem[]; customer: DocCustomer;
    }>(
      `SELECT number, doc_type, customer_id, financial_year, voided_at, to_char(bill_date, 'YYYY-MM-DD') AS date,
              to_char(due_date, 'YYYY-MM-DD') AS due_date, total, paid, payment_note, apply_gst, items, customer
       FROM bills WHERE id = $1 FOR UPDATE`,
      [id],
    );
    const old = rows[0];
    if (!old) return { ok: false, error: "This document no longer exists." };
    if (old.voided_at) return { ok: false, error: `${old.number} is cancelled and can't be edited.` };
    if (old.doc_type !== d.docType) return { ok: false, error: "The document type can't be changed. Convert it instead." };
    if (old.customer_id !== d.customerId) {
      return { ok: false, error: "The customer can't be changed. Cancel this document and create a new one." };
    }
    if (old.financial_year && financialYear(d.date) !== old.financial_year) {
      return { ok: false, error: `${old.number} belongs to financial year ${old.financial_year}; keep the date within it.` };
    }

    await db.query(
      `UPDATE bills SET bill_date = $2, due_date = $3, customer = $4, items = $5, apply_gst = $6, round_off = $7,
         taxable = $8, tax = $9, total = $10, paid = $11, payment_note = $12, business = $13, signature = $14,
         updated_by = $15, updated_at = now()
       WHERE id = $1`,
      [
        id, d.date, d.dueDate, JSON.stringify(d.customer), JSON.stringify(d.items), d.applyGst, d.roundOff,
        d.taxable, d.tax, d.total, d.paid, d.paymentNote, JSON.stringify(d.business), d.signature, actor,
      ],
    );
    const changes = diff(
      auditView({ ...old, dueDate: old.due_date, total: Number(old.total), paid: Number(old.paid), paymentNote: old.payment_note, applyGst: old.apply_gst }),
      auditView(d),
      AUDIT_LABELS,
    );
    if (changes) {
      await writeAudit(db, {
        customerId: d.customerId,
        entity: "bill",
        entityId: id,
        action: "updated",
        summary: `${d.docType} ${old.number} edited: ${Object.keys(changes).join(", ")}`,
        changes,
        actor,
      });
    }
    return { ok: true, id, number: old.number };
  });
}

export type VoidState = { error?: string } | undefined;

// Cancel a document. It keeps its number and stays visible, marked cancelled, but no longer
// counts toward balances or reports.
export async function voidDocument(id: string, _prev: VoidState, formData: FormData): Promise<VoidState> {
  const actor = await requireUser();
  const reason = str(formData.get("reason"), 300);
  if (reason.length < 3) return { error: "Give a reason for cancelling (at least 3 characters)." };
  if (!isUuid(id)) return { error: "This document no longer exists." };

  const result = await withTransaction(async (db) => {
    const { rows } = await db.query<{ number: string; doc_type: DocType; customer_id: string; voided_at: Date | null; total: string }>(
      "SELECT number, doc_type, customer_id, voided_at, total FROM bills WHERE id = $1 FOR UPDATE",
      [id],
    );
    const b = rows[0];
    if (!b) return "This document no longer exists.";
    if (b.voided_at) return `${b.number} is already cancelled.`;
    await db.query("UPDATE bills SET voided_at = now(), voided_by = $2, void_reason = $3 WHERE id = $1", [id, actor, reason]);
    await writeAudit(db, {
      customerId: b.customer_id,
      entity: "bill",
      entityId: id,
      action: "voided",
      summary: `${b.doc_type} ${b.number} (${rupees(Number(b.total))}) cancelled: ${reason}`,
      actor,
    });
    return null;
  });
  if (result) return { error: result };
  // Reload the document page so it shows as cancelled.
  redirect(`/bills/${id}`);
}
