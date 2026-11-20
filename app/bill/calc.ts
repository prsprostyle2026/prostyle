// Bill arithmetic shared by the bill maker, the saved-document view and the server
// (which recalculates totals itself rather than trusting the browser).
import { round2, taxBreakup, type TaxLine } from "./gst";

export type DocItem = { name: string; hsn: string; rate: number; qty: number; gst: number };

export type Totals = {
  rows: (DocItem & { taxable: number; gstRate: number; tax: number; amount: number })[];
  totalQty: number;
  taxableTotal: number;
  taxLines: TaxLine[];
  taxTotal: number;
  exactTotal: number;
  total: number;
  roundOffAmount: number;
  intraState: boolean;
};

export function computeTotals(opts: {
  items: DocItem[];
  applyGst: boolean;
  roundOff: boolean;
  placeOfSupply: string; // "29-KARNATAKA"
  sellerGstin: string;
}): Totals {
  const rows = opts.items
    .filter((it) => it.name.trim())
    .map((it) => {
      const taxable = round2(it.rate * it.qty);
      const gstRate = opts.applyGst ? it.gst : 0;
      const tax = round2((taxable * gstRate) / 100);
      return { ...it, taxable, gstRate, tax, amount: round2(taxable + tax) };
    });
  // Same state as the seller's GSTIN -> CGST + SGST, different state -> IGST.
  const intraState = opts.placeOfSupply.slice(0, 2) === opts.sellerGstin.slice(0, 2);
  const taxableTotal = round2(rows.reduce((s, r) => s + r.taxable, 0));
  const taxLines = taxBreakup(rows, intraState);
  const taxTotal = round2(taxLines.reduce((s, l) => s + l.amount, 0));
  const exactTotal = round2(taxableTotal + taxTotal);
  const total = opts.roundOff ? Math.round(exactTotal) : exactTotal;
  return {
    rows,
    totalQty: rows.reduce((s, r) => s + r.qty, 0),
    taxableTotal,
    taxLines,
    taxTotal,
    exactTotal,
    total,
    roundOffAmount: round2(total - exactTotal),
    intraState,
  };
}
