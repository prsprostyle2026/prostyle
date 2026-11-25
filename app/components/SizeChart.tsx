import { FITS, SIZES, type FitKey } from "@/lib/size-chart";

// The Prostyle size chart as a table: one row per size, a W/L column pair per garment fit.
// `fits` limits it to some fits (e.g. just the ones a product uses).
export default function SizeChart({ fits, className = "" }: { fits?: FitKey[]; className?: string }) {
  const cols = fits ? FITS.filter((f) => fits.includes(f.key)) : FITS;
  return (
    <div className={`overflow-x-auto rounded-2xl border border-foreground/10 bg-background print:overflow-visible ${className}`}>
      <table className="w-full min-w-lg border-collapse text-center text-sm tabular-nums">
        <caption className="sr-only">Size chart in inches. W is width, L is length.</caption>
        <thead>
          <tr className="bg-neutral-950 text-gold-light print:bg-white print:text-black">
            <th scope="col" rowSpan={2} className="sticky left-0 print:static bg-neutral-950 px-3 py-2 text-left text-xs font-bold uppercase tracking-wider print:bg-white">
              Size
            </th>
            {cols.map((f) => (
              <th key={f.key} scope="colgroup" colSpan={2} className="border-l border-white/15 px-3 pt-2 text-xs font-bold uppercase tracking-wider">
                {f.label}
              </th>
            ))}
          </tr>
          <tr className="bg-neutral-950 text-white print:bg-white print:text-black">
            {cols.map((f) => (
              <Pair key={f.key} />
            ))}
          </tr>
        </thead>
        <tbody>
          {SIZES.map((s, i) => (
            <tr
              key={s.size}
              className={`border-t border-foreground/10 ${i % 2 ? "bg-foreground/3" : ""} ${
                s.size === "S" ? "border-t-2 border-t-accent" : ""
              }`}
            >
              <th scope="row" className="sticky left-0 print:static bg-background px-3 py-2 text-left whitespace-nowrap">
                <span className="font-bold">{s.size}</span> <span className="font-semibold text-accent-ink">{s.chest}</span>
              </th>
              {cols.map((f) => (
                <Cells key={f.key} w={f.w[i]} l={f.l[i]} />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Pair() {
  return (
    <>
      <th scope="col" className="border-l border-white/15 px-3 pb-2 text-xs font-semibold" title="Width">W</th>
      <th scope="col" className="px-3 pb-2 text-xs font-semibold" title="Length">L</th>
    </>
  );
}

function Cells({ w, l }: { w: number; l: number }) {
  return (
    <>
      <td className="border-l border-foreground/10 px-3 py-2">{w}</td>
      <td className="px-3 py-2">{l}</td>
    </>
  );
}

export function HowToMeasure({ className = "" }: { className?: string }) {
  return (
    <ul className={`space-y-1 text-sm text-foreground/70 ${className}`}>
      <li><span className="font-semibold text-foreground">Size:</span> kids go by age (1Y–12Y), adults S–4XL. Each also has a number (20–48); order by either.</li>
      <li><span className="font-semibold text-foreground">W, jerseys:</span> lay the garment flat and measure armpit to armpit.</li>
      <li><span className="font-semibold text-foreground">L, jerseys:</span> top of the shoulder straight down to the hem.</li>
      <li><span className="font-semibold text-foreground">Shorts:</span> W across the waistband laid flat, L from waistband to hem.</li>
      <li>All measurements are in inches and may vary by about ½ inch. Between sizes? Choose the larger one.</li>
    </ul>
  );
}
