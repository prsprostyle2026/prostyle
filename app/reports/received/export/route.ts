import type { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { csvResponse } from "@/lib/csv";
import { defaultPeriod } from "@/lib/gst-report";
import { getReceivedReport, NOT_RECORDED } from "@/lib/received-report";
import { isReceiver } from "@/lib/receivers";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// GET /reports/received/export?from=&to=&by= — the "Received by" report as a CSV file,
// one row per transaction with its full change history.
export async function GET(req: NextRequest) {
  await requireUser();
  const sp = req.nextUrl.searchParams;
  const d = defaultPeriod();
  const from = DATE_RE.test(sp.get("from") ?? "") ? sp.get("from")! : d.from;
  const to = DATE_RE.test(sp.get("to") ?? "") ? sp.get("to")! : d.to;
  const rawBy = sp.get("by") ?? "";
  const by = isReceiver(rawBy) || rawBy === NOT_RECORDED ? rawBy : "";
  const r = await getReceivedReport(from, to, by);

  const rows: (string | number)[][] = [
    ["Date", "Type", "Reference", "Customer", "Amount", "Received by", "Method / note", "Status", "Recorded by", "Recorded at (IST)", "History"],
    ...r.receipts.map((x) => [
      x.date,
      x.kind === "bill" ? (x.docType ?? "Document") : "Payment",
      x.kind === "bill" ? x.ref : "",
      x.customerName,
      x.amount.toFixed(2),
      x.receivedBy,
      x.detail,
      x.voided ? `Cancelled${x.voidReason ? `: ${x.voidReason}` : ""}` : "Active",
      x.recordedBy,
      x.recordedAt,
      x.audit.map((a) => `${a.at} ${a.actor}: ${a.summary}`).join(" | "),
    ]),
    [],
    ["Totals (active entries)"],
    ...r.totals.map((t) => [t.name, t.count, t.amount.toFixed(2)]),
    ["Total", r.grand.count, r.grand.amount.toFixed(2)],
  ];
  const by_ = by ? `-${by.toLowerCase().replace(/\s+/g, "-")}` : "";
  return csvResponse(rows, `received${by_}-${from}-to-${to}.csv`);
}
