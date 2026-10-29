"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function EventForm({ venueId }: { venueId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setMessage("");
    const starts = String(formData.get("startsAt") ?? "");
    const response = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        venueId,
        title: String(formData.get("title") ?? "") || undefined,
        startsAt: starts ? new Date(starts).toISOString() : undefined,
        partySize: Number(formData.get("partySize") || 0) || undefined,
        impactMultiplier: Number(formData.get("impact") || 1.2),
        note: String(formData.get("note") ?? "") || undefined,
      }),
    });
    const body = (await response.json()) as { message?: string; success?: boolean };
    setMessage(body.message ?? "Saved");
    setPending(false);
    if (body.success) router.refresh();
  }

  return (
    <form action={onSubmit} className="grid gap-6 border border-border p-6 md:grid-cols-2">
      <label className="text-[11px] uppercase tracking-[0.18em]">
        Title
        <input name="title" className="mt-2 w-full border-b border-border bg-transparent py-2 text-base tracking-normal normal-case" placeholder="Wedding party" />
      </label>
      <label className="text-[11px] uppercase tracking-[0.18em]">
        Starts
        <input name="startsAt" type="datetime-local" className="mt-2 w-full border-b border-border bg-transparent py-2 text-base tracking-normal" />
      </label>
      <label className="text-[11px] uppercase tracking-[0.18em]">
        Party size
        <input name="partySize" inputMode="numeric" className="mt-2 w-full border-b border-border bg-transparent py-2 text-base tracking-normal" />
      </label>
      <label className="text-[11px] uppercase tracking-[0.18em]">
        Impact
        <input name="impact" defaultValue="1.3" className="mt-2 w-full border-b border-border bg-transparent py-2 text-base tracking-normal" />
      </label>
      <label className="md:col-span-2 text-[11px] uppercase tracking-[0.18em]">
        Or paste a note
        <textarea
          name="note"
          rows={3}
          className="mt-2 w-full border border-border bg-transparent p-3 text-base tracking-normal normal-case"
          placeholder="Wedding of 80 on Saturday at 8pm"
        />
      </label>
      <div className="md:col-span-2 flex items-center gap-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Recalculating" : "Add and replan"}
        </Button>
        {message && <p className="text-sm text-muted-foreground">{message}</p>}
      </div>
    </form>
  );
}
