"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// Shrinks a fixed-width A4 sheet (210mm ≈ 794px) to fit narrow screens such as phones,
// so the whole page is visible without sideways scrolling. Printing is unaffected:
// the print styles in globals.css remove the scaling.
export default function FitToWidth({ children }: { children: ReactNode }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState<{ scale: number; height: number } | null>(null);

  useEffect(() => {
    const o = outer.current;
    const i = inner.current;
    if (!o || !i) return;
    const measure = () => {
      // Hidden (e.g. the Preview tab isn't selected): measure again once it's shown.
      if (!o.clientWidth || !i.offsetWidth) return;
      const scale = Math.min(1, o.clientWidth / i.offsetWidth);
      setFit({ scale, height: i.offsetHeight * scale });
    };
    const ro = new ResizeObserver(measure);
    ro.observe(o);
    ro.observe(i);
    return () => ro.disconnect();
  }, []);

  const scaled = fit && fit.scale < 1;
  return (
    <div ref={outer} className="fit-outer w-full overflow-hidden" style={scaled ? { height: fit.height } : undefined}>
      <div
        ref={inner}
        className="fit-inner w-max"
        style={scaled ? { transform: `scale(${fit.scale})`, transformOrigin: "top left" } : { marginInline: "auto" }}
      >
        {children}
      </div>
    </div>
  );
}
