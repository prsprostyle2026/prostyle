// GST state codes, shown as "29-KARNATAKA" on the bill (same as the sample).
export const STATES: [code: string, name: string][] = [
  ["01", "JAMMU AND KASHMIR"],
  ["02", "HIMACHAL PRADESH"],
  ["03", "PUNJAB"],
  ["04", "CHANDIGARH"],
  ["05", "UTTARAKHAND"],
  ["06", "HARYANA"],
  ["07", "DELHI"],
  ["08", "RAJASTHAN"],
  ["09", "UTTAR PRADESH"],
  ["10", "BIHAR"],
  ["11", "SIKKIM"],
  ["12", "ARUNACHAL PRADESH"],
  ["13", "NAGALAND"],
  ["14", "MANIPUR"],
  ["15", "MIZORAM"],
  ["16", "TRIPURA"],
  ["17", "MEGHALAYA"],
  ["18", "ASSAM"],
  ["19", "WEST BENGAL"],
  ["20", "JHARKHAND"],
  ["21", "ODISHA"],
  ["22", "CHHATTISGARH"],
  ["23", "MADHYA PRADESH"],
  ["24", "GUJARAT"],
  ["26", "DADRA AND NAGAR HAVELI AND DAMAN AND DIU"],
  ["27", "MAHARASHTRA"],
  ["29", "KARNATAKA"],
  ["30", "GOA"],
  ["31", "LAKSHADWEEP"],
  ["32", "KERALA"],
  ["33", "TAMIL NADU"],
  ["34", "PUDUCHERRY"],
  ["35", "ANDAMAN AND NICOBAR ISLANDS"],
  ["36", "TELANGANA"],
  ["37", "ANDHRA PRADESH"],
  ["38", "LADAKH"],
  ["97", "OTHER TERRITORY"],
];

// Suggested slabs in the item GST% field; any other rate can still be typed.
export const GST_RATE_SUGGESTIONS = ["0", "5", "18", "40"];

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export type TaxLine = { label: string; amount: number };

type TaxableRow = { taxable: number; gstRate: number; tax: number };

// Groups tax by rate. Same state -> CGST + SGST (half each); otherwise IGST.
export function taxBreakup(rows: TaxableRow[], intraState: boolean): TaxLine[] {
  const byRate = new Map<number, number>();
  for (const r of rows) {
    if (r.gstRate > 0) byRate.set(r.gstRate, (byRate.get(r.gstRate) ?? 0) + r.tax);
  }
  const lines: TaxLine[] = [];
  for (const [rate, tax] of [...byRate].sort((a, b) => a[0] - b[0])) {
    if (intraState) {
      const half = round2(tax / 2);
      lines.push({ label: `CGST ${rate / 2}%`, amount: half });
      lines.push({ label: `SGST ${rate / 2}%`, amount: half });
    } else {
      lines.push({ label: `IGST ${rate}%`, amount: round2(tax) });
    }
  }
  return lines;
}
