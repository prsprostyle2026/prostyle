import Image from "next/image";
import Link from "next/link";

// The complete Prostyle logo laid out side by side (mark + PROSTYLE / SPORTS WEAR / tagline),
// for header and footer bars. Made for a light background, like the original artwork.
export default function Logo({
  className = "h-10 w-auto",
  href = "/",
  label = "Prostyle Sports Wear home",
}: {
  className?: string;
  href?: string;
  label?: string;
}) {
  return (
    <Link href={href} aria-label={label} className="inline-flex shrink-0 items-center">
      <Image
        src="/logo-horizontal.png"
        alt="Prostyle Sports Wear — Performance • Passion • Prostyle"
        width={742}
        height={124}
        loading="eager"
        className={className}
      />
    </Link>
  );
}

// The original stacked logo (home page, sign-in). On dark backgrounds it sits on a light card.
export function FullLogo({ className = "" }: { className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt="Prostyle Sports Wear — Performance • Passion • Prostyle"
      width={572}
      height={370}
      loading="eager"
      className={`h-auto dark:rounded-2xl dark:bg-white dark:p-3 ${className}`}
    />
  );
}
