"use client";

import { useEffect, useState } from "react";

type TimeLeft = { days: number; hours: number; minutes: number; seconds: number };

function getTimeLeft(target: number): TimeLeft {
  const diff = Math.max(0, target - Date.now());
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff / 3_600_000) % 24),
    minutes: Math.floor((diff / 60_000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export default function Countdown({ target }: { target: string }) {
  const targetMs = new Date(target).getTime();
  // Start as null so server and client render the same markup (avoids hydration mismatch).
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    const tick = () => setTimeLeft(getTimeLeft(targetMs));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetMs]);

  const units: [keyof TimeLeft, string][] = [
    ["days", "Days"],
    ["hours", "Hours"],
    ["minutes", "Minutes"],
    ["seconds", "Seconds"],
  ];

  return (
    <div className="mt-10 grid grid-cols-4 gap-3 sm:gap-4">
      {units.map(([key, label]) => (
        <div
          key={key}
          className="rounded-xl border border-foreground/10 bg-foreground/3 px-2 py-4 sm:py-6"
        >
          <div className="font-mono text-2xl font-semibold tabular-nums sm:text-4xl">
            {timeLeft ? String(timeLeft[key]).padStart(2, "0") : "--"}
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-widest text-foreground/60 sm:text-xs">
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}
