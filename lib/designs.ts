// Ready-made jersey designs from the Prostyle catalogue (prostyle catalogue.pdf), shown at /designs.
// Each image is in public/designs/NN.jpg and shows the front and back of one design.
// To add designs, put the next numbers there (e.g. 51.jpg) and raise DESIGN_COUNT.
export const DESIGN_COUNT = 50;
export const DESIGN_IMAGE = { width: 960, height: 474 };

export type Design = { no: string; src: string };

export const DESIGNS: Design[] = Array.from({ length: DESIGN_COUNT }, (_, i) => {
  const no = String(i + 1).padStart(2, "0");
  return { no, src: `/designs/${no}.jpg` };
});

export const isDesignNo = (v: unknown): v is string => typeof v === "string" && DESIGNS.some((d) => d.no === v);

// Printed on every catalogue page.
export const DESIGN_TERMS =
  "Sublimation fabric colours and pre-dyed fabric colours may not match 100%. Mock-ups are for reference only and are not the original product.";
