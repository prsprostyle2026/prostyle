// Row of summary figures. Two per row on phones, four on wide screens; the figure size
// steps down on small screens so large amounts like ₹1,23,45,678.00 still fit.
export type Tile = { label: string; value: string | number; strong?: boolean };

export default function StatTiles({ tiles, className = "mt-6" }: { tiles: Tile[]; className?: string }) {
  return (
    <dl className={`grid grid-cols-2 gap-3 lg:grid-cols-4 ${className}`}>
      {tiles.map((t) => (
        <div key={t.label} className="min-w-0 rounded-xl border border-foreground/10 p-3 sm:p-4">
          <dt className="text-xs font-medium text-foreground/60">{t.label}</dt>
          <dd
            className={`mt-1 break-words text-lg font-black leading-tight tabular-nums sm:text-2xl ${t.strong ? "text-accent" : ""}`}
          >
            {t.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
