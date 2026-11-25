import "server-only";
import { query } from "./db";
import { CLOSED_RESULTS } from "./enquiry-options";
import type { AuditLine } from "./received-report";

const IST = (col: string) => `to_char(${col} AT TIME ZONE 'Asia/Kolkata', 'DD Mon YYYY, HH12:MI AM')`;

export type Enquiry = {
  id: string;
  name: string;
  phone: string;
  email: string;
  organisation: string;
  product: string;
  quantity: number | null;
  message: string;
  attendedBy: string | null;
  attendedAt: string | null;
  result: string | null;
  resultNote: string;
  createdAt: string;
  history: AuditLine[];
};

// "new": nobody has attended it. "open": attended, still in progress. "closed": order confirmed / not interested / spam.
export type EnquiryFilter = "new" | "open" | "closed" | "all";
export const ENQUIRY_FILTERS: { key: EnquiryFilter; label: string }[] = [
  { key: "new", label: "New" },
  { key: "open", label: "In progress" },
  { key: "closed", label: "Closed" },
  { key: "all", label: "All" },
];
export const isEnquiryFilter = (v: unknown): v is EnquiryFilter => ENQUIRY_FILTERS.some((f) => f.key === v);

const WHERE: Record<EnquiryFilter, string> = {
  new: "attended_by IS NULL",
  open: "attended_by IS NOT NULL AND (result IS NULL OR NOT (result = ANY($1)))",
  closed: "attended_by IS NOT NULL AND result = ANY($1)",
  all: "true",
};

// Enquiries for one tab, newest first, each with its change history.
export async function getEnquiries(filter: EnquiryFilter): Promise<Enquiry[]> {
  const usesClosed = filter === "open" || filter === "closed";
  const { rows } = await query<Omit<Enquiry, "history">>(
    `SELECT id, name, phone, email, organisation, product, quantity, message,
            attended_by AS "attendedBy", ${IST("attended_at")} AS "attendedAt",
            result, result_note AS "resultNote", ${IST("created_at")} AS "createdAt"
     FROM enquiries WHERE ${WHERE[filter]}
     ORDER BY created_at DESC LIMIT 500`,
    usesClosed ? [CLOSED_RESULTS] : [],
  );
  if (rows.length === 0) return [];

  const audit = await query<AuditLine & { entityId: string }>(
    `SELECT entity_id AS "entityId", action, summary, changes, actor, ${IST("at")} AS at
     FROM audit_log WHERE entity = 'enquiry' AND entity_id = ANY($1)
     ORDER BY audit_log.at, id`,
    [rows.map((r) => r.id)],
  );
  const history = new Map<string, AuditLine[]>();
  for (const { entityId, ...line } of audit.rows) {
    history.set(entityId, [...(history.get(entityId) ?? []), line]);
  }
  return rows.map((r) => ({ ...r, history: history.get(r.id) ?? [] }));
}

// Counts for the tab labels and summary tiles.
export async function getEnquiryCounts() {
  const { rows } = await query<{ new: number; open: number; closed: number; orders: number; all: number }>(
    `SELECT count(*) FILTER (WHERE ${WHERE.new})::int AS "new",
            count(*) FILTER (WHERE ${WHERE.open})::int AS "open",
            count(*) FILTER (WHERE ${WHERE.closed})::int AS "closed",
            count(*) FILTER (WHERE result = 'Order confirmed')::int AS "orders",
            count(*)::int AS "all"
     FROM enquiries`,
    [CLOSED_RESULTS],
  );
  return rows[0];
}
