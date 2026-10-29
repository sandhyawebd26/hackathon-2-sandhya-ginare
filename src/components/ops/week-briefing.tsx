"use client";

import { useEffect, useState } from "react";

export function WeekBriefing({ venueId }: { venueId: string }) {
  const [text, setText] = useState("Reading the week…");
  const [source, setSource] = useState<"template" | "gemini" | "">("");

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/ai/briefing?venueId=${encodeURIComponent(venueId)}`)
      .then((response) => response.json())
      .then((body: { data?: { text: string; source: "template" | "gemini" } }) => {
        if (cancelled) return;
        setText(body.data?.text ?? "Briefing unavailable.");
        setSource(body.data?.source ?? "template");
      })
      .catch(() => {
        if (!cancelled) setText("Briefing unavailable.");
      });
    return () => {
      cancelled = true;
    };
  }, [venueId]);

  return (
    <section className="mb-10 border border-border bg-card p-6">
      <p className="text-[11px] uppercase tracking-[0.28em] text-accent">Gemini · This week</p>
      <p className="mt-4 text-sm leading-7">{text}</p>
      <p className="mt-3 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
        {source === "gemini" ? "Written with Gemini from forecast facts." : "Written from the same drivers without Gemini."}
      </p>
    </section>
  );
}
