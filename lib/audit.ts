import "server-only";
import type { PoolClient } from "./db";

export type AuditEntry = {
  customerId: string | null;
  entity: "customer" | "bill" | "payment" | "enquiry";
  entityId: string;
  action: "created" | "updated" | "deleted" | "voided" | "converted";
  summary: string;
  changes?: Record<string, { from: unknown; to: unknown }> | null;
  actor: string;
};

// Call inside the same transaction as the change, so the log and the data never disagree.
export async function writeAudit(db: PoolClient, e: AuditEntry) {
  await db.query(
    `INSERT INTO audit_log (customer_id, entity, entity_id, action, summary, changes, actor)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [e.customerId, e.entity, e.entityId, e.action, e.summary, e.changes ? JSON.stringify(e.changes) : null, e.actor],
  );
}

// Fields whose value differs between two versions of a record.
export function diff<T extends Record<string, unknown>>(before: T, after: T, labels: Partial<Record<keyof T, string>>) {
  const changes: Record<string, { from: unknown; to: unknown }> = {};
  for (const key of Object.keys(labels) as (keyof T)[]) {
    if (before[key] !== after[key]) changes[labels[key]!] = { from: before[key], to: after[key] };
  }
  return Object.keys(changes).length ? changes : null;
}
