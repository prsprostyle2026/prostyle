import type { Metadata } from "next";
import Link from "next/link";
import ContactDetails from "../components/ContactDetails";
import EnquiryForm from "../components/EnquiryForm";
import SizeChart, { HowToMeasure } from "../components/SizeChart";
import { ALL_PRODUCTS, BUYERS, CATEGORIES, FABRICS, SCHOOL_FABRICS, type Fabric, type Product, type Shape } from "@/lib/catalog";
import { CONTACT_PHONES, telHref } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Prostyle Sports Wear: Sublimation T-Shirt Manufacturer, Wholesale",
  description:
    "Prostyle Sports Wear manufactures custom sublimation t-shirts, jerseys, polos and school uniforms in Bengaluru, sold wholesale to teams, schools, companies and resellers.",
};

const HIGHLIGHTS = [
  { title: "Unlimited colours", text: "Full-colour, all-over designs at no extra cost per colour." },
  { title: "Never fades or cracks", text: "Ink becomes part of the fabric, so prints survive every wash." },
  { title: "Made in-house", text: "Design, printing, cutting and stitching under one roof in Bengaluru." },
  { title: "Wholesale pricing", text: "Factory-direct rates for bulk orders, with names and numbers included." },
];

const STEPS = [
  { title: "Share your idea", text: "Send your logo, colours, reference images, quantity and sizes." },
  { title: "Mock-up & quote", text: "We design a digital mock-up and send a wholesale quotation." },
  { title: "Approve & confirm", text: "Approve the design and size list (see the size chart), and confirm with an advance." },
  { title: "Print, stitch, dispatch", text: "We sublimate, stitch, quality-check and deliver to your door." },
];

// Pattern colours for the t-shirt illustrations, one per product card.
const SWATCHES = [
  ["#d4a12a", "#0b0b0b"],
  ["#1f4fd1", "#f5c842"],
  ["#c81e1e", "#141414"],
  ["#0f8a5f", "#f2f2f2"],
  ["#6b2bd9", "#d4a12a"],
  ["#0b0b0b", "#e0b03a"],
];

export default function HomePage() {
  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="relative overflow-hidden bg-neutral-950 text-white">
        <div aria-hidden className="pointer-events-none absolute -right-32 -top-32 h-128 w-lg rounded-full bg-gold/25 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-gold-light">Manufacturer &middot; Wholesale</p>
            <h1 className="mt-4 text-4xl font-black uppercase italic leading-[1.05] tracking-tight sm:text-6xl">
              Custom sublimation <span className="text-gold-light">t-shirts</span>, made to perform
            </h1>
            <p className="mt-6 max-w-xl text-base text-neutral-300 sm:text-lg">
              Prostyle Sports Wear designs and manufactures all-over sublimation t-shirts, jerseys and polos, and
              complete school uniforms, supplied wholesale to teams, schools, companies and resellers.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#enquire"
                className="-skew-x-12 rounded-md bg-gold px-6 py-3 text-sm font-bold uppercase tracking-wider text-black transition-colors hover:bg-gold-light"
              >
                <span className="inline-block skew-x-12">Get a wholesale quote</span>
              </a>
              <a
                href="#products"
                className="-skew-x-12 rounded-md border border-white/30 px-6 py-3 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:border-gold-light hover:text-gold-light"
              >
                <span className="inline-block skew-x-12">View products</span>
              </a>
            </div>
          </div>
          <div className="flex justify-center gap-4 sm:gap-6" aria-hidden>
            <Tee uid="h0" colors={SWATCHES[0]} className="w-36 -rotate-6 sm:w-48" />
            <Tee uid="h1" colors={SWATCHES[1]} className="mt-10 w-36 rotate-3 sm:w-48" />
            <Tee uid="h2" colors={SWATCHES[2]} className="hidden w-48 -rotate-2 sm:block" />
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section aria-label="Why Prostyle" className="border-b-2 border-gold bg-gold-soft text-neutral-900">
        <ul className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          {HIGHLIGHTS.map((h) => (
            <li key={h.title}>
              <p className="font-bold uppercase tracking-wide text-gold-dark">{h.title}</p>
              <p className="mt-1 text-sm text-neutral-700">{h.text}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Products */}
      <section id="products" aria-labelledby="products-heading" className="mx-auto max-w-7xl scroll-mt-28 px-4 py-16 sm:px-6">
        <SectionHeading id="products-heading" kicker="What we make" title="Our product range" />
        {CATEGORIES.map((cat) => (
          <div key={cat.key} id={cat.key} className="mt-12 scroll-mt-28 first-of-type:mt-10">
            <h3 className="text-xl font-black uppercase italic tracking-tight">{cat.title}</h3>
            <p className="mt-1 max-w-3xl text-sm text-foreground/70">{cat.intro}</p>
            <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {ALL_PRODUCTS.filter((p) => p.category === cat.key).map((p, i) => (
                <ProductCard key={p.code} p={p} colors={SWATCHES[(i + (cat.key === "school" ? 3 : 0)) % SWATCHES.length]} />
              ))}
            </ul>
          </div>
        ))}
      </section>

      {/* Fabrics */}
      <section id="fabrics" aria-labelledby="fabrics-heading" className="scroll-mt-28 bg-foreground/3">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <SectionHeading id="fabrics-heading" kicker="Choose your fabric" title="Our fabrics">
            Pick the fabric that suits your sport, school and budget.
          </SectionHeading>
          <FabricTable
            title="Sportswear fabrics"
            note="Sublimation bonds permanently with polyester, so all our sportswear fabrics are polyester or polyester blends. Every one is available for cricket jerseys too."
            fabrics={FABRICS}
          />
          <FabricTable
            title="School uniform fabrics"
            note="Polyester blends and 100% cotton for shirts, trousers, skirts and cotton tees, in white, solid colours or your school's checks. Cotton is dyed in your colours, with logos embroidered or screen-printed. Sublimated house, PT and track wear use the sportswear fabrics above."
            fabrics={SCHOOL_FABRICS}
          />
          <p className="mt-3 text-xs text-foreground/50">GSM = fabric weight in grams per square metre. Higher is thicker. Best quality = the weight we recommend for a premium, long-lasting finish.</p>
        </div>
      </section>

      {/* Size chart */}
      <section id="sizes" aria-labelledby="sizes-heading" className="mx-auto max-w-7xl scroll-mt-28 px-4 pt-16 sm:px-6">
        <SectionHeading id="sizes-heading" kicker="Find the right fit" title="Size chart">
          One chart for every sport: jerseys, t-shirts, shorts and pants, kids to adults, in inches. Send us the size
          list with your order, one line per player.
        </SectionHeading>
        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_18rem]">
          <SizeChart />
          <div>
            <HowToMeasure />
            <Link
              href="/size-guide"
              className="mt-5 inline-block rounded-md border border-accent px-4 py-2 text-sm font-bold text-accent-ink hover:bg-accent/10"
            >
              Open printable size guide
            </Link>
          </div>
        </div>
      </section>

      {/* How ordering works */}
      <section aria-labelledby="process-heading" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <SectionHeading id="process-heading" kicker="Wholesale orders" title="How ordering works" />
        <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="rounded-2xl border border-foreground/10 p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-lg font-black text-accent-foreground">
                {i + 1}
              </span>
              <p className="mt-4 font-bold">{s.title}</p>
              <p className="mt-1 text-sm text-foreground/70">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Who we supply */}
      <section aria-labelledby="buyers-heading" className="bg-neutral-950 text-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <h2 id="buyers-heading" className="text-xs font-bold uppercase tracking-[0.3em] text-gold-light">Who we supply</h2>
          <ul className="mt-6 flex flex-wrap gap-3">
            {BUYERS.map((b) => (
              <li key={b} className="rounded-full border border-gold/50 px-4 py-2 text-sm font-semibold">{b}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* Enquiry */}
      <section id="enquire" aria-labelledby="enquire-heading" className="mx-auto max-w-7xl scroll-mt-28 px-4 py-16 sm:px-6">
        <div className="grid gap-8 rounded-3xl border-2 border-accent/40 bg-accent/5 p-6 sm:p-10 lg:grid-cols-2">
          <div>
            <h2 id="enquire-heading" className="text-3xl font-black uppercase italic tracking-tight sm:text-4xl">
              Get a wholesale quote
            </h2>
            <p className="mt-4 text-foreground/70">
              Tell us the product, fabric, quantity, sizes and your design. We&apos;ll reply with a mock-up and
              price. Call us, or send the form and we&apos;ll call you back.
            </p>
            <a
              href={telHref(CONTACT_PHONES[0])}
              className="mt-6 inline-block rounded-md bg-accent px-6 py-3 text-sm font-bold uppercase tracking-wider text-accent-foreground hover:bg-accent-hover"
            >
              Call us now
            </a>
            <ContactDetails tone="page" className="mt-8" />
            <div className="mt-6 text-sm">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent-ink">Factory</p>
              <address className="mt-2 not-italic text-foreground/80">
                CN 83/131, Ground Floor, Ramnaikanahalli, Kathriguppe Road,
                <br />
                Opp. Banashankari Bricks, Bengaluru Urban, Karnataka 562125
              </address>
            </div>
          </div>
          <EnquiryForm groups={CATEGORIES.map((cat) => ({ label: cat.title, products: ALL_PRODUCTS.filter((p) => p.category === cat.key).map((p) => p.name) }))} />
        </div>
      </section>
    </main>
  );
}

function ProductCard({ p, colors }: { p: Product; colors: string[] }) {
  return (
    <li className="flex flex-col overflow-hidden rounded-2xl border border-foreground/10 bg-foreground/3">
      <div className="flex justify-center bg-neutral-100 py-6 dark:bg-neutral-900" aria-hidden>
        <Garment uid={p.code} shape={p.shape ?? "tee"} colors={colors} className="w-32" />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h4 className="text-lg font-bold">{p.name}</h4>
          <span className="font-mono text-xs text-foreground/50">{p.code}</span>
        </div>
        <p className="mt-2 text-sm text-foreground/70">{p.description}</p>
        <dl className="mt-4 space-y-2 text-sm">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-accent-ink">Fabrics</dt>
            <dd>{p.fabrics.join(" · ")}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-accent-ink">Sizes</dt>
            <dd>
              {p.sizes}{" "}
              <a href="#sizes" className="whitespace-nowrap font-semibold text-accent-ink hover:underline">Size chart</a>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-accent-ink">Options</dt>
            <dd>{p.options.join(" · ")}</dd>
          </div>
        </dl>
      </div>
    </li>
  );
}

function FabricTable({ title, note, fabrics }: { title: string; note: string; fabrics: Fabric[] }) {
  return (
    <div className="mt-10">
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="mt-1 max-w-3xl text-sm text-foreground/70">{note}</p>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-foreground/10 bg-background">
        <table className="w-full min-w-2xl table-fixed text-left text-sm">
          <thead className="border-b border-foreground/10 bg-foreground/5 text-xs uppercase tracking-wider text-foreground/60">
            <tr>
              <th scope="col" className="w-1/4 px-4 py-3">Fabric</th>
              <th scope="col" className="w-[30%] px-4 py-3">Look &amp; feel</th>
              <th scope="col" className="px-4 py-3">Best for</th>
              <th scope="col" className="w-24 px-4 py-3 text-right">GSM</th>
              <th scope="col" className="w-28 px-4 py-3 text-right text-accent-ink">Best quality</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-foreground/10">
            {fabrics.map((f) => (
              <tr key={f.name}>
                <th scope="row" className="px-4 py-3 font-semibold">{f.name}</th>
                <td className="px-4 py-3 text-foreground/70">{f.feel}</td>
                <td className="px-4 py-3 text-foreground/70">{f.bestFor}</td>
                <td className="px-4 py-3 text-right tabular-nums">{f.gsm}</td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums text-accent-ink">{f.bestGsm}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Product card illustration: a t-shirt, or simple shorts / pants / skirt silhouettes.
const OUTLINES: Record<Exclude<Shape, "tee" | "shirt">, string> = {
  shorts: "M50 30 L150 30 L162 130 L108 130 L100 80 L92 130 L38 130 Z",
  pants: "M58 18 L142 18 L150 190 L112 190 L100 70 L88 190 L50 190 Z",
  skirt: "M68 30 L132 30 L172 170 Q100 186 28 170 Z",
};

function Garment({ uid, shape, colors, className }: { uid: string; shape: Shape; colors: string[]; className?: string }) {
  if (shape === "tee") return <Tee uid={uid} colors={colors} className={className} />;
  const [base, stripe] = colors;
  if (shape === "shirt") {
    // Plain uniform shirt: solid colour, collar, button placket and a pocket.
    return (
      <svg viewBox="0 0 200 200" className={`drop-shadow-xl ${className}`}>
        <path d={TEE_PATH} fill="#f4f6fb" stroke="#0b0b0b" strokeOpacity="0.25" strokeWidth="2" strokeLinejoin="round" />
        <path d="M70 18 L100 52 L130 18 L118 14 L100 34 L82 14 Z" fill="#ffffff" stroke="#0b0b0b" strokeOpacity="0.3" strokeWidth="2" strokeLinejoin="round" />
        <path d="M100 52 L100 186" stroke="#0b0b0b" strokeOpacity="0.2" strokeWidth="2" />
        {[72, 98, 124, 150].map((y) => <circle key={y} cx="100" cy={y} r="3" fill={base} />)}
        <rect x="120" y="72" width="22" height="24" rx="2" fill="none" stroke={base} strokeWidth="2" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 200 200" className={`drop-shadow-xl ${className}`}>
      <path d={OUTLINES[shape]} fill={base} stroke="#0b0b0b" strokeOpacity="0.25" strokeWidth="2" strokeLinejoin="round" />
      <rect x={shape === "skirt" ? 68 : shape === "pants" ? 58 : 50} y={shape === "pants" ? 18 : 30} width={shape === "skirt" ? 64 : shape === "pants" ? 84 : 100} height="10" fill={stripe} />
      {shape !== "skirt" && <path d={shape === "pants" ? "M146 40 L150 190" : "M154 50 L160 125"} stroke={stripe} strokeWidth="6" />}
      {shape === "skirt" && <path d="M84 40 L64 176 M100 40 L100 180 M116 40 L136 176" stroke={stripe} strokeOpacity="0.5" strokeWidth="3" />}
    </svg>
  );
}
function SectionHeading({ id, kicker, title, children }: { id: string; kicker: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="max-w-2xl">
      <p className="text-xs font-bold uppercase tracking-[0.3em] text-accent-ink">{kicker}</p>
      <h2 id={id} className="mt-2 text-3xl font-black uppercase italic tracking-tight sm:text-4xl">{title}</h2>
      {children && <p className="mt-3 text-foreground/70">{children}</p>}
    </div>
  );
}

const TEE_PATH = "M70 18 L40 28 L8 62 L32 86 L48 72 L48 186 L152 186 L152 72 L168 86 L192 62 L160 28 L130 18 Q100 44 70 18 Z";

// A simple t-shirt silhouette with a diagonal "sublimated" stripe pattern.
function Tee({ uid, colors: [base, stripe], className = "" }: { uid: string; colors: string[]; className?: string }) {
  const id = `tee-${uid}`;
  return (
    <svg viewBox="0 0 200 200" className={`drop-shadow-xl ${className}`}>
      <defs>
        <pattern id={id} width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <rect width="40" height="40" fill={base} />
          <rect width="12" height="40" fill={stripe} opacity="0.85" />
          <rect x="18" width="4" height="40" fill={stripe} opacity="0.45" />
        </pattern>
      </defs>
      <path
        d={TEE_PATH}
        fill={`url(#${id})`}
        stroke="#0b0b0b"
        strokeOpacity="0.25"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M70 18 Q100 44 130 18" fill="none" stroke={stripe} strokeWidth="5" />
    </svg>
  );
}
