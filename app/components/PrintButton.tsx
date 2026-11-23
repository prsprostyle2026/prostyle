"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

function printAs(title: string) {
  // Browsers use the page title as the default PDF file name.
  const original = document.title;
  document.title = title;
  window.print();
  document.title = original;
}

// Print button for receipts and statements. With autoPrint, opens the print dialog once on
// arrival and then removes ?print=1 from the address so a reload doesn't print again.
export default function PrintButton({ fileName, autoPrint = false, label = "Print / Save as PDF" }: {
  fileName: string;
  autoPrint?: boolean;
  label?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!autoPrint) return;
    const t = setTimeout(() => {
      printAs(fileName);
      router.replace(pathname, { scroll: false });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on arrival
  }, []);

  return (
    <button
      type="button"
      onClick={() => printAs(fileName)}
      className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-bold text-accent-foreground hover:bg-accent-hover sm:w-auto print:hidden"
    >
      {label}
    </button>
  );
}
