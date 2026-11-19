import Link from "next/link";

// Placeholder logo. When the real logo arrives, drop it in /public (e.g. logo.svg)
// and replace the mark + wordmark below with:
//   <Image src="/logo.svg" alt="Prostyle Sports Wear" width={160} height={40} priority />
export default function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="Prostyle Sports Wear home"
      className={`group inline-flex items-center gap-2.5 ${className}`}
    >
      <span
        aria-hidden
        className="flex h-9 w-9 -skew-x-12 items-center justify-center rounded-md bg-accent text-lg font-black italic text-white transition-transform group-hover:scale-105"
      >
        <span className="skew-x-12">P</span>
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-lg font-black uppercase italic tracking-tight">
          Prostyle
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.35em] text-foreground/60">
          Sports Wear
        </span>
      </span>
    </Link>
  );
}
