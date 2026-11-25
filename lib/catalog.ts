// Product catalogue shown on the public /home page.
// To list a new product or fabric, add an entry here; the page picks it up automatically.
import { ADULT_RANGE, SIZE_RANGE } from "./size-chart";

// Values marked "confirm" are typical industry figures — replace them with your own before sharing widely.

export type Fabric = {
  name: string;
  feel: string; // how it looks and feels, in a few words
  bestFor: string;
  gsm: string; // weight range, e.g. "140–160" (confirm with your fabric supplier)
};

export type Product = {
  code: string; // short style code used in quotes and bills, e.g. "PS-RN"
  name: string;
  description: string;
  fabrics: string[]; // names from FABRICS
  sizes: string;
  options: string[]; // collar, sleeve, extras
};

// Sublimation only bonds with polyester, so every fabric here is polyester or a polyester blend.
export const FABRICS: Fabric[] = [
  { name: "Micro Polyester (Dri-fit)", feel: "Smooth, light, quick-dry", bestFor: "Everyday team tees, events, marathons", gsm: "140–160" },
  { name: "Honeycomb", feel: "Textured hexagon weave, breathable", bestFor: "Cricket and football jerseys", gsm: "160–180" },
  { name: "Mesh / Airtex", feel: "Open holes for maximum airflow", bestFor: "Football, kabaddi, training wear", gsm: "140–160" },
  { name: "Matty", feel: "Matte finish, soft and durable", bestFor: "Corporate and school tees, polos", gsm: "180–220" },
  { name: "Lycra (Poly-Spandex)", feel: "Stretchy, body-fitting, glossy", bestFor: "Cycling, gym and compression wear", gsm: "180–220" },
  { name: "Interlock", feel: "Thick, double-knit, premium hand-feel", bestFor: "Polo t-shirts, premium club kits", gsm: "180–200" },
];

export const PRODUCTS: Product[] = [
  {
    code: "PS-RN",
    name: "Round Neck T-Shirt",
    description: "All-over sublimated crew neck: the go-to for teams, events and promotions.",
    fabrics: ["Micro Polyester (Dri-fit)", "Honeycomb", "Matty"],
    sizes: SIZE_RANGE,
    options: ["Half / full sleeve", "Raglan or set-in sleeve"],
  },
  {
    code: "PS-PL",
    name: "Polo T-Shirt",
    description: "Collared polo with a sublimated body, for corporate, school and club uniforms.",
    fabrics: ["Matty", "Interlock", "Micro Polyester (Dri-fit)"],
    sizes: SIZE_RANGE,
    options: ["Printed or knitted collar", "Button placket", "Logo on chest"],
  },
  {
    code: "PS-CJ",
    name: "Cricket Jersey",
    description: "Lightweight playing jersey with names, numbers and sponsor logos printed in.",
    fabrics: ["Honeycomb", "Micro Polyester (Dri-fit)"],
    sizes: SIZE_RANGE,
    options: ["Collar or round neck", "Half / full sleeve", "Matching trousers"],
  },
  {
    code: "PS-FJ",
    name: "Football Jersey",
    description: "Breathable match jersey with names and numbers, with matching shorts.",
    fabrics: ["Mesh / Airtex", "Honeycomb", "Micro Polyester (Dri-fit)"],
    sizes: SIZE_RANGE,
    options: ["V-neck or round neck", "Matching shorts"],
  },
  {
    code: "PS-KB",
    name: "Kabaddi Jersey",
    description: "Short, close-fitting kabaddi jersey that stays in place during raids and tackles.",
    fabrics: ["Lycra (Poly-Spandex)", "Mesh / Airtex", "Micro Polyester (Dri-fit)"],
    sizes: SIZE_RANGE,
    options: ["Sleeveless or half sleeve", "Matching shorts"],
  },
  {
    code: "PS-VB",
    name: "Volleyball Jersey",
    description: "Light, stretchy jersey that moves with every serve, set and spike.",
    fabrics: ["Micro Polyester (Dri-fit)", "Mesh / Airtex", "Lycra (Poly-Spandex)"],
    sizes: SIZE_RANGE,
    options: ["Sleeveless or half sleeve", "Matching shorts"],
  },
  {
    code: "PS-BB",
    name: "Basketball Jersey",
    description: "Longer, loose-cut sleeveless jersey with deep armholes for free movement.",
    fabrics: ["Mesh / Airtex", "Micro Polyester (Dri-fit)"],
    sizes: SIZE_RANGE,
    options: ["Sleeveless", "Reversible on request", "Matching shorts"],
  },
  {
    code: "PS-SH",
    name: "Sports Shorts",
    description: "Sublimated shorts to match any jersey, with an elastic waist and drawcord.",
    fabrics: ["Micro Polyester (Dri-fit)", "Mesh / Airtex", "Lycra (Poly-Spandex)"],
    sizes: SIZE_RANGE,
    options: ["Side pockets", "Drawcord", "Side panel in team colours"],
  },
  {
    code: "PS-TP",
    name: "Track Pants",
    description: "Sublimated track pants to complete the kit, for training, travel and warm-ups.",
    fabrics: ["Micro Polyester (Dri-fit)", "Lycra (Poly-Spandex)", "Interlock"],
    sizes: SIZE_RANGE,
    options: ["Zip pockets", "Elastic waist with drawcord", "Straight or tapered leg", "Side panel in team colours"],
  },  {
    code: "PS-VN",
    name: "V-Neck T-Shirt",
    description: "Sporty V-neck in any design, popular for gyms, clubs and fan wear.",
    fabrics: ["Micro Polyester (Dri-fit)", "Lycra (Poly-Spandex)"],
    sizes: ADULT_RANGE,
    options: ["Half / full sleeve", "Slim or regular fit"],
  },
  {
    code: "PS-FS",
    name: "Full Sleeve Performance Tee",
    description: "Long-sleeve tee for sun protection, cycling, running and winter training.",
    fabrics: ["Lycra (Poly-Spandex)", "Micro Polyester (Dri-fit)"],
    sizes: ADULT_RANGE,
    options: ["Thumb holes", "Zip or round neck"],
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
