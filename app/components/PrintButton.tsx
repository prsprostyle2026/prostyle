"use client";

// Print button for statements and the size guide.
export default function PrintButton({ fileName, label = "Print / Save as PDF" }: { fileName: string; label?: string }) {
  function print() {
    // Browsers use the page title as the default PDF file name.
    const original = document.title;
    document.title = fileName;
    window.print();
    document.title = original;
  }

  return (
    <button
      type="button"
      onClick={print}
      className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-bold text-accent-foreground hover:bg-accent-hover sm:w-auto print:hidden"
    >
      {label}
    </button>
  );
}
