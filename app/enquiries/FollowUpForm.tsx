"use client";

import { useActionState } from "react";
import { ENQUIRY_RESULTS, LIMITS } from "@/lib/enquiry-options";
import { RECEIVERS } from "@/lib/receivers";
import { saveFollowUp } from "./actions";

const inputCls =
  "w-full rounded-md border border-foreground/15 bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/30";

// Who attended an enquiry, what came of it, and a note.
export default function FollowUpForm({
  id,
  attendedBy,
  result,
  resultNote,
}: {
  id: string;
  attendedBy: string | null;
  result: string | null;
  resultNote: string;
}) {
  const [state, formAction, saving] = useActionState(saveFollowUp.bind(null, id), undefined);

  return (
    // Re-mounted when the saved values change, so the fields always show what's stored.
    <form key={`${attendedBy}|${result}|${resultNote}`} action={formAction} className="grid gap-3 sm:grid-cols-[10rem_12rem_1fr_auto] sm:items-end">
      <label className="block space-y-1">
        <span className="text-xs font-medium text-foreground/70">Attended by</span>
        <select name="attendedBy" defaultValue={attendedBy ?? ""} className={inputCls}>
          <option value="">Not attended yet</option>
          {RECEIVERS.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
      </label>
      <label className="block space-y-1">
        <span className="text-xs font-medium text-foreground/70">Result</span>
        <select name="result" defaultValue={result ?? ""} className={inputCls}>
          <option value="">No result yet</option>
          {ENQUIRY_RESULTS.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
      </label>
      <label className="block space-y-1">
        <span className="text-xs font-medium text-foreground/70">Note</span>
        <input name="resultNote" maxLength={LIMITS.note} defaultValue={resultNote} placeholder="e.g. Sent quote for 30 jerseys, call Friday" className={inputCls} />
      </label>
      <button
        type="submit"
        disabled={saving}
        className="rounded-md bg-accent px-4 py-2 text-sm font-bold text-accent-foreground hover:bg-accent-hover disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save"}
      </button>
      {state?.error && <p role="alert" className="text-sm font-medium text-danger sm:col-span-4">{state.error}</p>}
      {state?.ok && !saving && <p role="status" className="text-sm font-medium text-accent-ink sm:col-span-4">Saved.</p>}
    </form>
  );
}
