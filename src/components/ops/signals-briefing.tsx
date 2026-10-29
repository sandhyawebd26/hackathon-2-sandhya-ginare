"use client";

import { useEffect, useState } from "react";

export function SignalsBriefing({ venueId }: { venueId: string }) {
  const [text, setText] = useState("Reading holidays and events…");
  const [source, setSource] = useState<"template" | "gemini" | "">("");

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/ai/signals-brief?venueId=${encodeURIComponent(venueId)}`)
      .then((response) => response.json())
      .then((body: { data?: { text: string; source: "template" | "gemini" } }) => {
        if (cancelled) return;
        setText(body.data?.text ?? "Summary unavailable.");
        setSource(body.data?.source ?? "template");
      })
      .catch(() => {
        if (!cancelled) setText("Summary unavailable.");
      });
    return () => {
      cancelled = true;
    };
  }, [venueId]);

  return (
    <section className="mb-8 border border-border bg-card p-6">
      <p className="text-[11px] uppercase tracking-[0.28em] text-accent">Gemini · Calendar context</p>
      <p className="mt-4 text-sm leading-7">{text}</p>
      <p className="mt-3 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
        {source === "gemini"
          ? "Summarizes date-holidays + your events (not weather rows)."
          : "Template summary from the signal list."}
      </p>
    </section>
  );
}
