import Image from "next/image";

// Prostyle logo in the top-right of printed documents (bills, statements, receipts).
// The sheet must be `relative`. Loaded eagerly and unoptimised so print and PDF capture get the full image.
export default function SheetLogo() {
  return (
    <Image
      src="/logo.png"
      alt="Prostyle Sports Wear"
      width={572}
      height={370}
      loading="eager"
      unoptimized
      className="pointer-events-none absolute right-[12mm] top-[19mm] h-auto w-[44mm]"
    />
  );
}
