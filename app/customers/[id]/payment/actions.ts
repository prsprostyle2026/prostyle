"use server";

import { redirect } from "next/navigation";
import { writeAudit } from "@/lib/audit";
import { requireUser } from "@/lib/auth";
import { withTransaction } from "@/lib/db";
import { balanceLabel, rupees } from "@/lib/format";
import { isPaymentMethod } from "@/lib/payment-methods";
import { isReceiver } from "@/lib/receivers";

export type PaymentState = { error?: string; values?: Record<string, string> } | undefined;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function recordPayment(customerId: string, _prev: PaymentState, formData: FormData): Promise<PaymentState> {
  const actor = await requireUser();
  const values = {
    amount: String(formData.get("amount") ?? "").trim(),
    paidOn: String(formData.get("paidOn") ?? ""),
    method: String(formData.get("method") ?? ""),
    receivedBy: String(formData.get("receivedBy") ?? ""),
    note: String(formData.get("note") ?? "").trim().slice(0, 500),
  };
  const amount = Math.round(Number(values.amount) * 100) / 100;

  if (!UUID_RE.test(customerId)) return { error: "This customer no longer exists." };
  if (!Number.isFinite(amount) || amount <= 0 || amount >= 1e10) {
    return { error: "Enter an amount greater than zero.", values };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(values.paidOn)) return { error: "Enter the payment date.", values };
  if (!isPaymentMethod(values.method)) return { error: "Choose how they paid.", values };
  if (!isReceiver(values.receivedBy)) return { error: "Choose who received the payment.", values };

  const result = await withTransaction(async (db) => {
    // Same lock as saving a bill, so balances stay consistent.
    const found = await db.query<{ name: string }>("SELECT name FROM customers WHERE id = $1 FOR UPDATE", [customerId]);
    if (!found.rows[0]) return null;
    const inserted = await db.query<{ id: string }>(
      `INSERT INTO customer_payments (customer_id, amount, paid_on, method, note, created_by, received_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [customerId, amount, values.paidOn, values.method, values.note, actor, values.receivedBy],
    );
    const { rows } = await db.query<{ pending: string }>(
      "SELECT pending FROM customer_balances WHERE customer_id = $1",
      [customerId],
    );
    await writeAudit(db, {
      customerId,
      entity: "payment",
      entityId: inserted.rows[0].id,
      action: "created",
      summary: `Payment of ${rupees(amount)} by ${values.method}, received by ${values.receivedBy}${values.note ? ` (${values.note})` : ""}; balance now ${balanceLabel(Number(rows[0].pending))}`,
      actor,
    });
    return inserted.rows[0].id;
  });
  if (!result) return { error: "This customer no longer exists." };

  // Open the receipt so it can be printed for the customer.
  redirect(`/payments/${result}?print=1`);
}

export type VoidPaymentState = { error?: string } | undefined;

// Cancel a payment recorded by mistake. It stays on record, marked cancelled, and stops
// counting toward the balance.
export async function voidPayment(paymentId: string, _prev: VoidPaymentState, formData: FormData): Promise<VoidPaymentState> {
  const actor = await requireUser();
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 300);
  if (reason.length < 3) return { error: "Give a reason (at least 3 characters)." };
  if (!UUID_RE.test(paymentId)) return { error: "This payment no longer exists." };

  const error = await withTransaction(async (db) => {
    const { rows } = await db.query<{ customer_id: string; amount: string; method: string; received_by: string | null; voided_at: Date | null }>(
      "SELECT customer_id, amount, method, received_by, voided_at FROM customer_payments WHERE id = $1 FOR UPDATE",
      [paymentId],
    );
    const p = rows[0];
    if (!p) return "This payment no longer exists.";
    if (p.voided_at) return "This payment is already cancelled.";
    await db.query(
      "UPDATE customer_payments SET voided_at = now(), voided_by = $2, void_reason = $3 WHERE id = $1",
      [paymentId, actor, reason],
    );
    await writeAudit(db, {
      customerId: p.customer_id,
      entity: "payment",
      entityId: paymentId,
      action: "voided",
      summary: `Payment of ${rupees(Number(p.amount))} by ${p.method}${p.received_by ? `, received by ${p.received_by}` : ""} cancelled: ${reason}`,
      actor,
    });
    return null;
  });
  if (error) return { error };
  // Reload the receipt so it shows as cancelled.
  redirect(`/payments/${paymentId}`);
}
