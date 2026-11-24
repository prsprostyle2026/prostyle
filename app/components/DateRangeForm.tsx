import type { ReactNode } from "react";

// From / To date filter (a plain GET form, so the range is in the address and can be bookmarked).
// Phones: the two dates side by side with a full-width Show button; wider screens: one row.
// `fields`: extra filters shown before the Show button; `children`: buttons on the right.
export default function DateRangeForm({
  from,
  to,
  fields,
  children,
}: {
  from: string;
  to: string;
  fields?: ReactNode;
  children?: ReactNode;
}) {
  const input = "w-full rounded-md border border-foreground/15 bg-background px-3 py-2 text-sm";
  return (
    <form className="mt-5 grid grid-cols-2 items-end gap-3 sm:flex sm:flex-wrap print:hidden">
      <label className="min-w-0 space-y-1">
        <span className="block text-xs font-medium text-foreground/70">From</span>
        <input type="date" name="from" defaultValue={from} className={input} />
      </label>
      <label className="min-w-0 space-y-1">
        <span className="block text-xs font-medium text-foreground/70">To</span>
        <input type="date" name="to" defaultValue={to} className={input} />
      </label>
      {fields}
      <button
        type="submit"
        className="col-span-2 rounded-md border border-foreground/20 px-4 py-2.5 text-sm font-semibold hover:bg-foreground/5 sm:py-2"
      >
        Show
      </button>
      {children && <div className="col-span-2 flex flex-wrap gap-2 sm:ml-auto">{children}</div>}
    </form>
  );
}
