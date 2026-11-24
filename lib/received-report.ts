import "server-only";
import { query } from "./db";
import { RECEIVERS } from "./receivers";

// "Received by" report: every payment taken in a date range and who took it.
// Money comes in two ways:
//   - paid on a document when it was saved (bills.paid, dated by the document date)
//   - a separate payment (customer_payments, dated by the payment date)
// A quotation/proforma advance counts only until the document is converted; after that the
// same money is on the invoice/customer bill, so counting both would double it.
// Cancelled entries are listed (for the audit trail) but left out of the totals.

const IST = (col: string) => `to_char(${col} AT TIME ZONE 'Asia/Kolkata', 'DD Mon YYYY, HH12:MI AM')`;

export const NOT_RECORDED = "Not recorded"; // entries saved before "Received by" existed

export type AuditLine = {
  action: string;
  summary: string;
  changes: Record<string, { from: unknown; to: unknown }> | null;
  actor: string;
  at: string;
};

export type Receipt = {
  kind: "bill" | "payment";
  id: string;
  date: string; // yyyy-mm-dd
  ref: string; // document number, or "Payment"
  docType: string | null;
  customerId: string;
  customerName: string;
  amount: number;
  receivedBy: string; // a receiver, or NOT_RECORDED
  detail: string; // payment method / note
  recordedBy: string;
  recordedAt: string;
  voided: boolean;
  voidReason: string | null;
  audit: AuditLine[];
};

export type ReceiverTotal = { name: string; count: number; amount: number };

export type ReceivedReport = {
  receipts: Receipt[]; // newest first
  totals: ReceiverTotal[]; // one per receiver (+ NOT_RECORDED if any), active entries only
  grand: { count: number; amount: number };
};

// `by`: a receiver name, NOT_RECORDED, or "" for everyone.
export async function getReceivedReport(from: string, to: string, by: string): Promise<ReceivedReport> {
  const { rows } = await query<Omit<Receipt, "audit">>(
    `SELECT kind, id, date, ref, "docType", "customerId", "customerName", amount, "receivedBy", detail,
            "recordedBy", "recordedAt", voided, "voidReason"
     FROM (
       SELECT 'bill' AS kind, b.id::text AS id, to_char(b.bill_date, 'YYYY-MM-DD') AS date, b.number AS ref,
              b.doc_type AS "docType", b.customer_id::text AS "customerId", b.customer->>'name' AS "customerName",
              b.paid::float8 AS amount, coalesce(b.received_by, $3) AS "receivedBy", concat_ws(' · ', nullif(b.payment_method, ''), nullif(b.payment_note, '')) AS detail,
              b.created_by AS "recordedBy", ${IST("b.created_at")} AS "recordedAt", b.created_at AS "sortAt",
              b.voided_at IS NOT NULL AS voided, b.void_reason AS "voidReason"
       FROM bills b
       WHERE b.paid > 0 AND b.bill_date BETWEEN $1 AND $2
         AND NOT EXISTS (SELECT 1 FROM bills c WHERE c.converted_from = b.id AND c.voided_at IS NULL)
       UNION ALL
       SELECT 'payment', p.id::text, to_char(p.paid_on, 'YYYY-MM-DD'), 'Payment', NULL, p.customer_id::text, c.name,
              p.amount::float8, coalesce(p.received_by, $3), concat_ws(' · ', nullif(p.method, ''), nullif(p.note, '')),
              p.created_by, ${IST("p.created_at")}, p.created_at,
              p.voided_at IS NOT NULL, p.void_reason
       FROM customer_payments p JOIN customers c ON c.id = p.customer_id
       WHERE p.paid_on BETWEEN $1 AND $2
     ) r
     WHERE $4 = '' OR r."receivedBy" = $4
     ORDER BY r.date DESC, r."sortAt" DESC`,
    [from, to, NOT_RECORDED, by],
  );

  // Full change history of each listed entry, oldest first.
  const ids = (kind: string) => rows.filter((r) => r.kind === kind).map((r) => r.id);
  const { rows: audit } = rows.length
    ? await query<AuditLine & { entity: string; entityId: string }>(
        `SELECT entity, entity_id AS "entityId", action, summary, changes, actor, ${IST("at")} AS at
         FROM audit_log
         WHERE (entity = 'bill' AND entity_id = ANY($1)) OR (entity = 'payment' AND entity_id = ANY($2))
         ORDER BY audit_log.at, id`,
        [ids("bill"), ids("payment")],
      )
    : { rows: [] };
  const history = new Map<string, AuditLine[]>();
  for (const { entity, entityId, ...line } of audit) {
    const key = `${entity}:${entityId}`;
    history.set(key, [...(history.get(key) ?? []), line]);
  }

  const receipts: Receipt[] = rows.map((r) => ({ ...r, audit: history.get(`${r.kind}:${r.id}`) ?? [] }));

  const totals = new Map<string, ReceiverTotal>(RECEIVERS.map((n) => [n, { name: n, count: 0, amount: 0 }]));
  for (const r of receipts) {
    if (r.voided) continue;
    const t = totals.get(r.receivedBy) ?? { name: r.receivedBy, count: 0, amount: 0 };
    t.count += 1;
    t.amount = Math.round((t.amount + r.amount) * 100) / 100;
    totals.set(r.receivedBy, t);
  }
  const list = [...totals.values()].filter((t) => !by || t.name === by);
  return {
    receipts,
    totals: list,
    grand: {
      count: list.reduce((s, t) => s + t.count, 0),
      amount: Math.round(list.reduce((s, t) => s + t.amount, 0) * 100) / 100,
    },
  };
}
