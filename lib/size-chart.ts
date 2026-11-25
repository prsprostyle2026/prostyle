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

// One column group per garment cut, for every sport and product; w and l line up with SIZES (same order).
export type Fit = { key: string; label: string; note: string; w: number[]; l: number[] };

const run = (from: number) => SIZES.map((_, i) => from + i);

export const FITS: Fit[] = [
  // From the printed chart (its Kabaddi and Volleyball columns, which are identical).
  { key: "short", label: "Jersey · short cut", note: "Fitted, shorter body", w: run(17), l: run(11) },
  // From the printed chart (its Basketball column).
  { key: "regular", label: "Jersey · regular cut", note: "Standard t-shirt length", w: run(17), l: run(16) },
  // From the printed chart.
  { key: "shorts", label: "Shorts", note: "W = waist, L = length", w: run(17), l: run(13) },
  // Not on the printed chart: standard track-pant lengths, with the same waist as the shorts.
  // CONFIRM these lengths against your own patterns before relying on them.
  {
    key: "pants",
    label: "Pants",
    note: "W = waist, L = waist to ankle",
    w: run(17),
    l: [18, 20, 22, 24, 26, 28, 31, 34, 38, 39, 40, 41, 42, 42, 43],
  },
];

// "1Y (20) – 12Y (34)" style ranges for product listings.
const range = (rows: SizeRow[]) => `${rows[0].size} (${rows[0].chest}) – ${rows.at(-1)!.size} (${rows.at(-1)!.chest})`;
export const KIDS_RANGE = range(SIZES.filter((s) => s.kids));
export const ADULT_RANGE = range(SIZES.filter((s) => !s.kids));
export const SIZE_RANGE = `Kids ${KIDS_RANGE} · Adults ${ADULT_RANGE}`;
