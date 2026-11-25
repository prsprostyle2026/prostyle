import { FITS, SIZES } from "@/lib/size-chart";

// The Prostyle size chart: one row per size, a W/L column pair per garment cut.
// It's the same chart for every sport and product.
export default function SizeChart({ className = "" }: { className?: string }) {
  return (
    <div className={`overflow-x-auto rounded-2xl border border-foreground/10 bg-background print:overflow-visible ${className}`}>
      <table className="w-full min-w-xl border-collapse text-center text-sm tabular-nums">
        <caption className="sr-only">Size chart in inches for all sports. W is width or waist, L is length.</caption>
        <thead>
          <tr className="bg-neutral-950 text-gold-light print:bg-white print:text-black">
            <th scope="col" rowSpan={2} className="sticky left-0 bg-neutral-950 px-3 py-2 text-left text-xs font-bold uppercase tracking-wider print:static print:bg-white">
              Size
            </th>
            {FITS.map((f) => (
              <th key={f.key} scope="colgroup" colSpan={2} className="border-l border-white/15 px-3 pt-2">
                <span className="block text-xs font-bold uppercase tracking-wider">{f.label}</span>
                <span className="block text-[11px] font-normal text-white/60 print:text-neutral-500">{f.note}</span>
              </th>
            ))}
          </tr>
          <tr className="bg-neutral-950 text-white print:bg-white print:text-black">
            {FITS.map((f) => (
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
              <th scope="row" className="sticky left-0 bg-background px-3 py-2 text-left whitespace-nowrap print:static">
                <span className="font-bold">{s.size}</span> <span className="font-semibold text-accent-ink">{s.chest}</span>
              </th>
              {FITS.map((f) => (
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
      <th scope="col" className="border-l border-white/15 px-3 pb-2 text-xs font-semibold" title="Width / waist">W</th>
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
      <li><span className="font-semibold text-foreground">One chart for every sport:</span> cricket, football, kabaddi, volleyball, basketball, running and more.</li>
      <li><span className="font-semibold text-foreground">Size:</span> kids go by age (1Y–12Y), adults S–4XL. Each also has a number (20–48); order by either.</li>
      <li><span className="font-semibold text-foreground">Jerseys &amp; t-shirts:</span> choose the short cut for a fitted, shorter body or the regular cut for standard length.</li>
      <li><span className="font-semibold text-foreground">Shorts &amp; pants:</span> W is the waist and L the length, from the waistband down.</li>
      <li>All measurements are in inches and may vary by about ½ inch. Easiest check: compare with a garment that fits well. Between sizes? Choose the larger one.</li>
    </ul>
  );
}
