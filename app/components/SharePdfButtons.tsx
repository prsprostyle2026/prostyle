"use client";

import { useEffect, useRef, useState } from "react";
import { downloadFile, sheetToPdf } from "../bill/pdf";

// Share PDF and Print buttons for the A4 sheet (.bill-sheet) on the page. On phones, Share
// opens the share sheet (WhatsApp, email…); elsewhere the PDF is downloaded instead.
export default function SharePdfButtons({ fileName, title }: { fileName: string; title: string }) {
  // The PDF is prepared in the background so tapping Share opens the share sheet straight
  // away (phones only allow sharing right after a tap, not after a long wait).
  const pdf = useRef<File | null>(null);
  const [sharing, setSharing] = useState(false);
  const [msg, setMsg] = useState("");

  async function makePdf(): Promise<File> {
    const sheet = document.querySelector<HTMLElement>(".bill-sheet");
    if (!sheet) throw new Error("sheet not rendered");
    pdf.current = await sheetToPdf(sheet, fileName);
    return pdf.current;
  }

  useEffect(() => {
    pdf.current = null;
    const t = setTimeout(() => void makePdf().catch(() => {}), 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- rebuild only when the file changes
  }, [fileName]);

  async function share() {
    setMsg("");
    let file = pdf.current;
    if (!file) {
      setSharing(true);
      try {
        file = await makePdf();
      } catch {
        setMsg("Couldn't create the PDF. Please try again.");
        return;
      } finally {
        setSharing(false);
      }
    }
    const data: ShareData = { files: [file], title };
    if (typeof navigator.canShare === "function" && navigator.canShare(data)) {
      try {
        await navigator.share(data);
      } catch (err) {
        const name = (err as Error).name;
        if (name === "AbortError") return; // closed the share sheet
        if (name === "NotAllowedError") {
          setMsg("The PDF is ready. Tap Share again.");
          return;
        }
        downloadFile(file);
        setMsg("Couldn't open sharing, so the PDF was downloaded instead.");
      }
    } else {
      downloadFile(file);
      setMsg("This browser can't share files, so the PDF was downloaded. Attach it from your downloads.");
    }
  }

  function print() {
    // Browsers use the page title as the default file name.
    const original = document.title;
    document.title = fileName.replace(/\.pdf$/, "");
    window.print();
    document.title = original;
  }

  return (
    <div className="w-full space-y-2 sm:w-auto print:hidden">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={share}
          disabled={sharing}
          className="flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-accent-foreground hover:bg-accent-hover disabled:opacity-60"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v14" />
          </svg>
          {sharing ? "Preparing…" : "Share PDF"}
        </button>
        <button
          type="button"
          onClick={print}
          className="flex items-center justify-center gap-2 rounded-lg border-2 border-accent px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-accent-ink hover:bg-accent/10"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z" />
          </svg>
          Print
        </button>
      </div>
      {msg && <p role="status" className="text-sm text-foreground/70">{msg}</p>}
    </div>
  );
}
