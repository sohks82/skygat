"use client";

import { useEffect, useState } from "react";

/** Counts down to the auction in the viewer's own timezone. Renders nothing until mounted. */
export function Countdown({ date, startsAt }: { date: string; startsAt: string | null }) {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!startsAt) return;
    const target = new Date(`${date}T${startsAt}:00`).getTime();

    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        setLabel("under way");
        return;
      }
      const mins = Math.floor(diff / 60000);
      const d = Math.floor(mins / 1440);
      const h = Math.floor((mins % 1440) / 60);
      const m = mins % 60;
      setLabel(d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${m}m` : `${m}m`);
    };

    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [date, startsAt]);

  if (!label) return null;
  return (
    <span className="font-mono text-sm text-signal">
      {label === "under way" ? "under way" : `starts in ${label}`}
    </span>
  );
}
