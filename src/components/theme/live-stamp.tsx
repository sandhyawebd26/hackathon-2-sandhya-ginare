"use client";

import { useEffect, useState } from "react";

export function LiveStamp() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const paint = window.setTimeout(() => setNow(new Date()), 0);
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => {
      window.clearTimeout(paint);
      window.clearInterval(timer);
    };
  }, []);

  if (!now) return <div className="h-20" />;

  const date = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }).format(now);
  const time = new Intl.DateTimeFormat("en-GB", { hour: "numeric", minute: "2-digit" }).format(now);

  return (
    <div className="space-y-3 text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
      <p className="font-display text-5xl tracking-normal text-foreground normal-case">{date}</p>
      <p>
        {time}
      </p>
    </div>
  );
}
