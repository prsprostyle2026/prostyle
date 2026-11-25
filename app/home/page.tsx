import type { Metadata } from "next";
import Link from "next/link";
import ContactDetails from "../components/ContactDetails";
import SizeChart, { HowToMeasure } from "../components/SizeChart";
import { BUYERS, FABRICS, PRODUCTS } from "@/lib/catalog";
import { CONTACT_PHONES, telHref } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Prostyle Sports Wear: Sublimation T-Shirt Manufacturer, Wholesale",
  description:
    "Prostyle Sports Wear manufactures custom sublimation t-shirts, jerseys and polos in Bengaluru in a range of polyester fabrics, sold wholesale to teams, schools, companies and resellers.",
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
              Prostyle Sports Wear designs and manufactures all-over sublimation t-shirts, jerseys and polos in a
              choice of performance fabrics, supplied wholesale to teams, schools, companies and resellers.
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
        <SectionHeading id="products-heading" kicker="What we make" title="Our product range">
          Every style can be printed in any design, with team names, player numbers and sponsor logos at no extra cost.
        </SectionHeading>
        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PRODUCTS.map((p, i) => (
            <li key={p.code} className="flex flex-col overflow-hidden rounded-2xl border border-foreground/10 bg-foreground/3">
              <div className="flex justify-center bg-neutral-100 py-6 dark:bg-neutral-900" aria-hidden>
                <Tee uid={p.code} colors={SWATCHES[i % SWATCHES.length]} className="w-32" />
              </div>
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-lg font-bold">{p.name}</h3>
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
          ))}
        </ul>
      </section>

      {/* Fabrics */}
      <section id="fabrics" aria-labelledby="fabrics-heading" className="scroll-mt-28 bg-foreground/3">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <SectionHeading id="fabrics-heading" kicker="Choose your fabric" title="Fabrics we print on">
            Sublimation bonds permanently with polyester, so all our fabrics are polyester or polyester blends.
            Pick the one that suits your sport and budget.
          </SectionHeading>
          <div className="mt-10 overflow-x-auto rounded-2xl border border-foreground/10 bg-background">
            <table className="w-full min-w-xl text-left text-sm">
              <thead className="border-b border-foreground/10 bg-foreground/5 text-xs uppercase tracking-wider text-foreground/60">
                <tr>
                  <th scope="col" className="px-4 py-3">Fabric</th>
                  <th scope="col" className="px-4 py-3">Look &amp; feel</th>
                  <th scope="col" className="px-4 py-3">Best for</th>
                  <th scope="col" className="px-4 py-3 text-right">GSM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-foreground/10">
                {FABRICS.map((f) => (
                  <tr key={f.name}>
                    <th scope="row" className="px-4 py-3 font-semibold">{f.name}</th>
                    <td className="px-4 py-3 text-foreground/70">{f.feel}</td>
                    <td className="px-4 py-3 text-foreground/70">{f.bestFor}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{f.gsm}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-foreground/50">GSM = fabric weight in grams per square metre. Higher is thicker.</p>
        </div>
      </section>

      {/* Size chart */}
      <section id="sizes" aria-labelledby="sizes-heading" className="mx-auto max-w-7xl scroll-mt-28 px-4 pt-16 sm:px-6">
        <SectionHeading id="sizes-heading" kicker="Find the right fit" title="Size chart">
          Kids and adult sizes, in inches. Send us the size list with your order, one line per player.
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
              price.
            </p>
            <a
              href={telHref(CONTACT_PHONES[0])}
              className="mt-6 inline-block rounded-md bg-accent px-6 py-3 text-sm font-bold uppercase tracking-wider text-accent-foreground hover:bg-accent-hover"
            >
              Call us now
            </a>
          </div>
          <div className="space-y-6">
            <ContactDetails tone="page" />
            <div className="text-sm">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent-ink">Factory</p>
              <address className="mt-2 not-italic text-foreground/80">
                CN 83/131, Ground Floor, Ramnaikanahalli, Kathriguppe Road,
                <br />
                Opp. Banashankari Bricks, Bengaluru Urban, Karnataka 562125
              </address>
            </div>
          </div>
        </div>
      </section>
    </main>
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
        d="M70 18 L40 28 L8 62 L32 86 L48 72 L48 186 L152 186 L152 72 L168 86 L192 62 L160 28 L130 18 Q100 44 70 18 Z"
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
