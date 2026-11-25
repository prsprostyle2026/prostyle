// Prostyle size chart, from the shop's printed chart (size-chart.jpeg).
// Measurements are in inches, taken with the garment laid flat:
//   W = width (armpit to armpit for jerseys, across the waistband for shorts)
//   L = length (top of the shoulder to the hem for jerseys, waistband to hem for shorts)

export type SizeRow = {
  size: string; // label printed on the garment: "1Y" … "12Y", "S" … "4XL"
  chest: number; // size number shown beside it: 20 … 48
  kids: boolean;
};

export const SIZES: SizeRow[] = [
  { size: "1Y", chest: 20, kids: true },
  { size: "2Y", chest: 22, kids: true },
  { size: "3Y", chest: 24, kids: true },
  { size: "4Y", chest: 26, kids: true },
  { size: "6Y", chest: 28, kids: true },
  { size: "8Y", chest: 30, kids: true },
  { size: "10Y", chest: 32, kids: true },
  { size: "12Y", chest: 34, kids: true },
  { size: "S", chest: 36, kids: false },
  { size: "M", chest: 38, kids: false },
  { size: "L", chest: 40, kids: false },
  { size: "XL", chest: 42, kids: false },
  { size: "2XL", chest: 44, kids: false },
  { size: "3XL", chest: 46, kids: false },
  { size: "4XL", chest: 48, kids: false },
];

// One column group per garment fit; w and l line up with SIZES (same order).
export type Fit = { key: FitKey; label: string; w: number[]; l: number[] };
export type FitKey = "kabaddi" | "volleyball" | "basketball" | "shorts";

const run = (from: number) => SIZES.map((_, i) => from + i);

export const FITS: Fit[] = [
  { key: "kabaddi", label: "Kabaddi", w: run(17), l: run(11) },
  { key: "volleyball", label: "Volleyball", w: run(17), l: run(11) },
  { key: "basketball", label: "Basketball", w: run(17), l: run(16) },
  { key: "shorts", label: "Shorts", w: run(17), l: run(13) },
];

// "1Y (20) – 12Y (34)" style ranges for product listings.
const range = (rows: SizeRow[]) => `${rows[0].size} (${rows[0].chest}) – ${rows.at(-1)!.size} (${rows.at(-1)!.chest})`;
export const KIDS_RANGE = range(SIZES.filter((s) => s.kids));
export const ADULT_RANGE = range(SIZES.filter((s) => !s.kids));
export const SIZE_RANGE = `Kids ${KIDS_RANGE} · Adults ${ADULT_RANGE}`;
