// Product catalogue shown on the public /home page.
// To list a new product or fabric, add an entry here; the page picks it up automatically.
import { ADULT_RANGE, KIDS_RANGE, SIZE_RANGE } from "./size-chart";

// Values marked "confirm" are typical industry figures — replace them with your own before sharing widely.

export type Fabric = {
  name: string;
  feel: string; // how it looks and feels, in a few words
  bestFor: string;
  gsm: string; // weight range we offer, e.g. "180–220" (confirm with your fabric supplier)
  bestGsm: string; // the range we recommend for the best quality
};

export type Category = "sportswear" | "school";
export type Shape = "tee" | "shirt" | "shorts" | "pants" | "skirt"; // card illustration

export type Product = {
  code: string; // short style code used in quotes and bills, e.g. "PS-RN"
  category: Category;
  shape?: Shape; // defaults to "tee"
  name: string;
  description: string;
  fabrics: string[]; // names from FABRICS or SCHOOL_FABRICS
  sizes: string;
  options: string[]; // collar, sleeve, extras
};

// Sportswear fabrics. Sublimation only bonds with polyester, so every fabric here is polyester or a polyester blend.
export const FABRICS: Fabric[] = [
  { name: "DotKnit", feel: "Fine dot-textured knit, light, quick-dry", bestFor: "Cricket and team jerseys, events, marathons", gsm: "180–220", bestGsm: "200–220" },
  { name: "Honeycomb", feel: "Textured hexagon weave, breathable", bestFor: "Cricket and football jerseys", gsm: "180–220", bestGsm: "200–220" },
  { name: "Mesh / Airtex", feel: "Open holes for maximum airflow", bestFor: "Football, kabaddi, training wear", gsm: "140–160", bestGsm: "150–160" },
  { name: "Matty", feel: "Matte finish, soft and durable", bestFor: "Corporate and school tees, polos", gsm: "180–220", bestGsm: "200–220" },
  { name: "Lycra (Poly-Spandex)", feel: "Stretchy, body-fitting, glossy", bestFor: "Cycling, gym and compression wear", gsm: "180–220", bestGsm: "200–220" },
  { name: "Interlock", feel: "Thick, double-knit, premium hand-feel", bestFor: "Polo t-shirts, premium club kits", gsm: "180–200", bestGsm: "190–200" },
];

export const PRODUCTS: Product[] = [
  {
    code: "PS-RN",
    category: "sportswear",
    name: "Round Neck T-Shirt",
    description: "All-over sublimated crew neck: the go-to for teams, events and promotions.",
    fabrics: ["DotKnit", "Honeycomb", "Matty"],
    sizes: SIZE_RANGE,
    options: ["Half / full sleeve", "Raglan or set-in sleeve"],
  },
  {
    code: "PS-PL",
    category: "sportswear",
    name: "Polo T-Shirt",
    description: "Collared polo with a sublimated body, for corporate and club uniforms.",
    fabrics: ["Matty", "Interlock", "DotKnit"],
    sizes: SIZE_RANGE,
    options: ["Printed or knitted collar", "Button placket", "Logo on chest"],
  },
  {
    code: "PS-CJ",
    category: "sportswear",
    name: "Cricket Jersey",
    description: "Lightweight playing jersey with names, numbers and sponsor logos printed in.",
    fabrics: FABRICS.map((f) => f.name), // cricket jerseys come in every knit fabric we print on
    sizes: SIZE_RANGE,
    options: ["Collar or round neck", "Half / full sleeve", "Matching trousers"],
  },
  {
    code: "PS-FJ",
    category: "sportswear",
    name: "Football Jersey",
    description: "Breathable match jersey with names and numbers, with matching shorts.",
    fabrics: ["Mesh / Airtex", "Honeycomb", "DotKnit"],
    sizes: SIZE_RANGE,
    options: ["V-neck or round neck", "Matching shorts"],
  },
  {
    code: "PS-KB",
    category: "sportswear",
    name: "Kabaddi Jersey",
    description: "Short, close-fitting kabaddi jersey that stays in place during raids and tackles.",
    fabrics: ["Lycra (Poly-Spandex)", "Mesh / Airtex", "DotKnit"],
    sizes: SIZE_RANGE,
    options: ["Sleeveless or half sleeve", "Matching shorts"],
  },
  {
    code: "PS-VB",
    category: "sportswear",
    name: "Volleyball Jersey",
    description: "Light, stretchy jersey that moves with every serve, set and spike.",
    fabrics: ["DotKnit", "Mesh / Airtex", "Lycra (Poly-Spandex)"],
    sizes: SIZE_RANGE,
    options: ["Sleeveless or half sleeve", "Matching shorts"],
  },
  {
    code: "PS-BB",
    category: "sportswear",
    name: "Basketball Jersey",
    description: "Longer, loose-cut sleeveless jersey with deep armholes for free movement.",
    fabrics: ["Mesh / Airtex", "DotKnit"],
    sizes: SIZE_RANGE,
    options: ["Sleeveless", "Reversible on request", "Matching shorts"],
  },
  {
    code: "PS-SH",
    category: "sportswear",
    shape: "shorts",
    name: "Sports Shorts",
    description: "Sublimated shorts to match any jersey, with an elastic waist and drawcord.",
    fabrics: ["DotKnit", "Mesh / Airtex", "Lycra (Poly-Spandex)"],
    sizes: SIZE_RANGE,
    options: ["Side pockets", "Drawcord", "Side panel in team colours"],
  },
  {
    code: "PS-TP",
    category: "sportswear",
    shape: "pants",
    name: "Track Pants",
    description: "Sublimated track pants to complete the kit, for training, travel and warm-ups.",
    fabrics: ["DotKnit", "Lycra (Poly-Spandex)", "Interlock"],
    sizes: SIZE_RANGE,
    options: ["Zip pockets", "Elastic waist with drawcord", "Straight or tapered leg", "Side panel in team colours"],
  },
  {
    code: "PS-VN",
    category: "sportswear",
    name: "V-Neck T-Shirt",
    description: "Sporty V-neck in any design, popular for gyms, clubs and fan wear.",
    fabrics: ["DotKnit", "Lycra (Poly-Spandex)"],
    sizes: ADULT_RANGE,
    options: ["Half / full sleeve", "Slim or regular fit"],
  },
  {
    code: "PS-FS",
    category: "sportswear",
    name: "Full Sleeve Performance Tee",
    description: "Long-sleeve tee for sun protection, cycling, running and winter training.",
    fabrics: ["Lycra (Poly-Spandex)", "DotKnit"],
    sizes: ADULT_RANGE,
    options: ["Thumb holes", "Zip or round neck"],
  },
];

// Classic school-uniform fabrics for shirts, trousers, skirts and cotton tees. These aren't sublimated
// (that needs polyester): they're dyed in the school's colours, then cut and stitched, with logos
// embroidered or screen-printed. Typical GSM; confirm with your supplier.
export const SCHOOL_FABRICS: Fabric[] = [
  { name: "Poly-Cotton (PC 65:35)", feel: "Crisp, easy to iron, low shrinkage", bestFor: "School shirts", gsm: "180–220", bestGsm: "200–220" },
  { name: "Spun", feel: "Soft, cotton-like feel, breathable and durable", bestFor: "Shirts, trousers and salwar uniforms", gsm: "180–220", bestGsm: "200–220" },
  { name: "Cotton Shirting", feel: "100% cotton, soft and breathable, cool in summer", bestFor: "School shirts", gsm: "180–220", bestGsm: "200–220" },
  { name: "Cotton Twill", feel: "100% cotton, diagonal weave, strong and comfortable", bestFor: "Trousers, skirts, pinafores", gsm: "220–280", bestGsm: "240–260" },
  { name: "Cotton Pique", feel: "100% cotton, textured knit, breathable", bestFor: "Polo and house t-shirts", gsm: "180–220", bestGsm: "200–220" },
  { name: "Cotton Hosiery (Jersey)", feel: "100% cotton, soft stretchy knit", bestFor: "PT t-shirts", gsm: "180–220", bestGsm: "200–220" },
  { name: "Poly-Viscose (PV) Suiting", feel: "Smooth drape, wrinkle-resistant, holds a crease", bestFor: "Trousers, skirts, pinafores", gsm: "200–260", bestGsm: "230–260" },
  { name: "Terry-Wool", feel: "Rich finish, warm and hard-wearing", bestFor: "Winter trousers and skirts", gsm: "250–300", bestGsm: "270–300" },
];

export const SCHOOL_PRODUCTS: Product[] = [
  {
    code: "SU-HT",
    category: "school",
    name: "House T-Shirt",
    description: "House colours with the school crest and house name, for sports day and PE: sublimated, or in cotton.",
    fabrics: ["DotKnit", "Matty", "Interlock", "Cotton Pique"],
    sizes: SIZE_RANGE,
    options: ["Round neck or polo collar", "House name on back", "School crest on chest"],
  },
  {
    code: "SU-PE",
    category: "school",
    name: "PT / Sports Uniform",
    description: "Matching t-shirt with shorts or track pants for weekly PT, in school colours.",
    fabrics: ["DotKnit", "Matty", "Interlock", "Cotton Hosiery (Jersey)"],
    sizes: SIZE_RANGE,
    options: ["T-shirt + shorts or track pants", "House colour panels", "School crest"],
  },
  {
    code: "SU-TS",
    category: "school",
    name: "School Track Suit",
    description: "Zip jacket and track pants for winter, sports meets and school trips.",
    fabrics: ["Interlock", "Matty"],
    sizes: SIZE_RANGE,
    options: ["Full-zip jacket", "School name on back", "Elastic cuffs and waist"],
  },
  {
    code: "SU-SS",
    category: "school",
    shape: "shirt",
    name: "School Shirt",
    description: "Everyday uniform shirt in white, a solid colour or the school's checks.",
    fabrics: ["Poly-Cotton (PC 65:35)", "Spun", "Cotton Shirting"],
    sizes: SIZE_RANGE,
    options: ["Half / full sleeve", "Plain or checks", "Pocket with school logo"],
  },
  {
    code: "SU-TR",
    category: "school",
    shape: "pants",
    name: "School Trousers",
    description: "Hard-wearing uniform trousers and half pants that keep their shape wash after wash.",
    fabrics: ["Poly-Viscose (PV) Suiting", "Spun", "Cotton Twill", "Terry-Wool"],
    sizes: SIZE_RANGE,
    options: ["Full or half pants", "Elastic or belt waist", "Side pockets"],
  },
  {
    code: "SU-SK",
    category: "school",
    shape: "skirt",
    name: "Skirt / Pinafore",
    description: "Pleated skirts and pinafores in solid colours or checks, for girls' uniforms.",
    fabrics: ["Poly-Viscose (PV) Suiting", "Cotton Twill", "Terry-Wool"],
    sizes: KIDS_RANGE,
    options: ["Box or knife pleats", "Pinafore with straps", "Adjustable waist"],
  },
];

export const ALL_PRODUCTS: Product[] = [...PRODUCTS, ...SCHOOL_PRODUCTS];

export const CATEGORIES: { key: Category; title: string; intro: string }[] = [
  {
    key: "sportswear",
    title: "Sportswear",
    intro: "Every style can be printed in any design, with team names, player numbers and sponsor logos at no extra cost.",
  },
  {
    key: "school",
    title: "School uniforms",
    intro: "Complete uniforms for schools: shirts, trousers and skirts in classic uniform fabrics, and house, PT and track wear sublimated in your school colours.",
  },
];
// Who buys from us wholesale.
export const BUYERS = [
  "Sports teams & clubs",
  "Schools & colleges",
  "Corporate & IT companies",
  "Marathons & events",
  "Gyms & fitness studios",
  "Retailers & resellers",
];
