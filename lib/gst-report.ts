import "server-only";
import { computeTotals, type DocItem } from "@/app/bill/calc";
import { DEFAULT_BUSINESS, type Business, type DocCustomer } from "@/app/bill/docTypes";
import { round2 } from "@/app/bill/gst";
import { query } from "./db";

// GST summary for a date range, built from saved, non-cancelled Invoices (the tax documents).
// Tax is recalculated from each invoice's items with the same code that printed it.

export type RateLine = { rate: number; taxable: number; cgst: number; sgst: number; igst: number };

export type InvoiceLine = {
  id: string;
  number: string;
  date: string;
  customerName: string;
  gstin: string; // "" = unregistered (B2C)
  placeOfSupply: string;
  invoiceValue: number;
  rates: RateLine[];
};

export type GstReport = {
  from: string;
  to: string;
  invoices: InvoiceLine[];
  byRate: RateLine[];
  b2cByState: (RateLine & { placeOfSupply: string })[];
  totals: { invoiceValue: number; taxable: number; cgst: number; sgst: number; igst: number; count: number; b2b: number };
};

// Adds a rate line into a running total kept under `key` (created with `init` the first time).
function add<T extends RateLine>(map: Map<string, T>, key: string, l: RateLine, init: () => T) {
  const cur = map.get(key) ?? init();
  cur.taxable = round2(cur.taxable + l.taxable);
  cur.cgst = round2(cur.cgst + l.cgst);
  cur.sgst = round2(cur.sgst + l.sgst);
  cur.igst = round2(cur.igst + l.igst);
  map.set(key, cur);
}
const zero = (rate: number): RateLine => ({ rate, taxable: 0, cgst: 0, sgst: 0, igst: 0 });

export async function getGstReport(from: string, to: string): Promise<GstReport> {
  const { rows } = await query<{
    id: string; number: string; date: string; customer: DocCustomer; business: Business | null;
    items: DocItem[]; apply_gst: boolean; round_off: boolean; total: number;
  }>(
    `SELECT id, number, to_char(bill_date, 'YYYY-MM-DD') AS date, customer, business, items, apply_gst, round_off,
            total::float8 AS total
     FROM bills
     WHERE doc_type = 'Invoice' AND voided_at IS NULL AND bill_date BETWEEN $1 AND $2
     ORDER BY bill_date, seq NULLS FIRST, created_at`,
    [from, to],
  );

  const invoices: InvoiceLine[] = rows.map((r) => {
    const sellerGstin = (r.business ?? DEFAULT_BUSINESS).gstin || DEFAULT_BUSINESS.gstin;
    const t = computeTotals({
      items: r.items,
      applyGst: r.apply_gst,
      roundOff: r.round_off,
      placeOfSupply: r.customer.placeOfSupply,
      sellerGstin,
    });
    const byRate = new Map<number, { taxable: number; tax: number }>();
    for (const row of t.rows) {
      const cur = byRate.get(row.gstRate) ?? { taxable: 0, tax: 0 };
      byRate.set(row.gstRate, { taxable: round2(cur.taxable + row.taxable), tax: round2(cur.tax + row.tax) });
    }
    const rates = [...byRate]
      .sort((a, b) => a[0] - b[0])
      .map(([rate, v]) =>
        t.intraState
          ? { rate, taxable: v.taxable, cgst: round2(v.tax / 2), sgst: round2(v.tax / 2), igst: 0 }
          : { rate, taxable: v.taxable, cgst: 0, sgst: 0, igst: v.tax },
      );
    return {
      id: r.id,
      number: r.number,
      date: r.date,
      customerName: r.customer.name,
      gstin: (r.customer.gstin ?? "").trim(),
      placeOfSupply: r.customer.placeOfSupply,
      invoiceValue: r.total,
      rates,
    };
  });

  const byRate = new Map<string, RateLine>();
  const b2c = new Map<string, RateLine & { placeOfSupply: string }>();
  for (const inv of invoices) {
    for (const l of inv.rates) {
      add(byRate, String(l.rate), l, () => zero(l.rate));
      if (!inv.gstin) {
        add(b2c, `${inv.placeOfSupply}|${l.rate}`, l, () => ({ ...zero(l.rate), placeOfSupply: inv.placeOfSupply }));
      }
    }
  }
  const sum = (k: keyof RateLine) => round2([...byRate.values()].reduce((s, l) => s + (l[k] as number), 0));

  return {
    from,
    to,
    invoices,
    byRate: [...byRate.values()].sort((a, b) => a.rate - b.rate),
    b2cByState: [...b2c.values()].sort((a, b) => a.placeOfSupply.localeCompare(b.placeOfSupply) || a.rate - b.rate),
    totals: {
      invoiceValue: round2(invoices.reduce((s, i) => s + i.invoiceValue, 0)),
      taxable: sum("taxable"),
      cgst: sum("cgst"),
      sgst: sum("sgst"),
      igst: sum("igst"),
      count: invoices.length,
      b2b: invoices.filter((i) => i.gstin).length,
    },
  };
}

// Default period: the current month so far (India time).
export function defaultPeriod() {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
  return { from: `${today.slice(0, 7)}-01`, to: today };
}
