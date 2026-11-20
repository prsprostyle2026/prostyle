import { rupees } from "@/lib/format";
import type { DocType } from "../bill/docTypes";

const BADGE: Record<DocType, string> = {
  Invoice: "bg-blue-600/10 text-blue-700 dark:text-blue-300",
  "Customer Bill": "bg-foreground/10 text-foreground/70",
  Quotation: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
  "Proforma Invoice": "bg-violet-500/15 text-violet-800 dark:text-violet-300",
};

export function DocTypeBadge({ type }: { type: DocType }) {
  return (
    <span className={`ml-1 rounded px-1.5 py-0.5 align-middle text-[10px] font-bold uppercase ${BADGE[type]}`}>
      {type === "Proforma Invoice" ? "Proforma" : type}
    </span>
  );
}

export function CancelledBadge() {
  return (
    <span className="ml-1 rounded bg-accent/15 px-1.5 py-0.5 align-middle text-[10px] font-bold uppercase text-accent">
      Cancelled
    </span>
  );
}

// Expandable item list under a document number (no JavaScript needed).
export default function BillItems({ items }: { items: { name: string; qty: number; rate: number; gst: number }[] }) {
  return (
    <details className="mt-0.5 text-xs">
      <summary className="cursor-pointer text-foreground/60 hover:text-accent">
        {items.length} {items.length === 1 ? "item" : "items"}
      </summary>
      <ul className="mt-1 space-y-0.5 text-foreground/70">
        {items.map((it, i) => (
          <li key={i}>
            {it.name} — {it.qty} × {rupees(it.rate)}
            {it.gst ? ` + ${it.gst}% GST` : ""}
          </li>
        ))}
      </ul>
    </details>
  );
}
