import { requireUser } from "@/lib/auth";
import { csvResponse } from "@/lib/csv";
import { defaultPeriod, getGstReport } from "@/lib/gst-report";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// GET /reports/gst/export?from=yyyy-mm-dd&to=yyyy-mm-dd&kind=invoices|rates
export async function GET(request: Request) {
  await requireUser();
  const url = new URL(request.url);
  const d = defaultPeriod();
  const from = DATE_RE.test(url.searchParams.get("from") ?? "") ? url.searchParams.get("from")! : d.from;
  const to = DATE_RE.test(url.searchParams.get("to") ?? "") ? url.searchParams.get("to")! : d.to;
  const kind = url.searchParams.get("kind") === "rates" ? "rates" : "invoices";
  const r = await getGstReport(from, to);

  const rows: (string | number)[][] =
    kind === "rates"
      ? [
          ["GST rate %", "Taxable value", "CGST", "SGST", "IGST", "Total tax"],
          ...r.byRate.map((l) => [l.rate, l.taxable, l.cgst, l.sgst, l.igst, +(l.cgst + l.sgst + l.igst).toFixed(2)]),
        ]
      : [
          ["Type", "GSTIN of recipient", "Customer name", "Invoice number", "Invoice date", "Invoice value",
            "Place of supply", "Rate %", "Taxable value", "CGST", "SGST", "IGST"],
          ...r.invoices.flatMap((inv) =>
            inv.rates.map((l) => [
              inv.gstin ? "B2B" : "B2C", inv.gstin, inv.customerName, inv.number, inv.date, inv.invoiceValue,
              inv.placeOfSupply, l.rate, l.taxable, l.cgst, l.sgst, l.igst,
            ]),
          ),
        ];

  return csvResponse(rows, `gst-${kind}-${from}-to-${to}.csv`);
}
