"use server";

import { refresh } from "next/cache";
import { diff, writeAudit } from "@/lib/audit";
import { requireUser } from "@/lib/auth";
import { withTransaction } from "@/lib/db";
import { isUuid } from "@/lib/documents";
import { isEnquiryResult, LIMITS } from "@/lib/enquiry-options";
import { isReceiver } from "@/lib/receivers";

export type FollowUpState = { ok?: boolean; error?: string } | undefined;

const LABELS = { attendedBy: "Attended by", result: "Result", resultNote: "Note" } as const;

// Staff follow-up on an enquiry: who attended it, the result and a note. Logged in the audit trail.
export async function saveFollowUp(id: string, _prev: FollowUpState, formData: FormData): Promise<FollowUpState> {
  const actor = await requireUser();
  if (!isUuid(id)) return { error: "This enquiry no longer exists." };

  const attendedBy = String(formData.get("attendedBy") ?? "");
  const result = String(formData.get("result") ?? "");
  const resultNote = String(formData.get("resultNote") ?? "").trim().slice(0, LIMITS.note);
  if (attendedBy && !isReceiver(attendedBy)) return { error: "Choose who attended it from the list." };
  if (result && !isEnquiryResult(result)) return { error: "Choose a result from the list." };
  if (result && !attendedBy) return { error: "Choose who attended it before setting a result." };

  const error = await withTransaction(async (db) => {
    const { rows } = await db.query<{ name: string; attendedBy: string | null; result: string | null; resultNote: string }>(
      `SELECT name, attended_by AS "attendedBy", result, result_note AS "resultNote"
       FROM enquiries WHERE id = $1 FOR UPDATE`,
      [id],
    );
    const old = rows[0];
    if (!old) return "This enquiry no longer exists.";

    const next = { attendedBy: attendedBy || null, result: result || null, resultNote };
    const changes = diff({ ...old }, { name: old.name, ...next }, LABELS);
    if (!changes) return null;

    await db.query(
      `UPDATE enquiries
       SET attended_by = $2::text, result = $3, result_note = $4, updated_by = $5, updated_at = now(),
           attended_at = CASE WHEN $2::text IS NULL THEN NULL
                              WHEN attended_by IS DISTINCT FROM $2::text THEN now()
                              ELSE attended_at END
       WHERE id = $1`,
      [id, next.attendedBy, next.result, next.resultNote, actor],
    );
    const summary = !next.attendedBy
      ? `Enquiry from ${old.name} marked not attended`
      : `Enquiry from ${old.name}: attended by ${next.attendedBy}${next.result ? `, ${next.result}` : ""}`;
    await writeAudit(db, { customerId: null, entity: "enquiry", entityId: id, action: "updated", summary, changes, actor });
    return null;
  });
  if (error) return { error };
  refresh();
  return { ok: true };
}
