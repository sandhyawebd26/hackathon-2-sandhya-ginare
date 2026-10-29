"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { Recommendation } from "@/lib/domain";
import { formatMoney } from "@/lib/time";

export function ApprovalList({
  rows,
  currency,
}: {
  rows: Recommendation[];
  currency: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");

  async function act(id: string, action: "accepted" | "edited" | "ignored") {
    setPending(id);
    setMessage("");
    const response = await fetch(`/api/recommendations/${id}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        editedRequired: action === "edited" ? Number(edits[id]) : undefined,
        notes: action === "edited" ? "Manager override" : undefined,
      }),
    });
    const body = (await response.json()) as { message?: string; success?: boolean };
    setMessage(body.message ?? "");
    setPending(null);
    if (body.success) router.refresh();
  }

  if (!rows.length) {
    return <p className="text-sm text-muted-foreground">No open gaps in the next seven days.</p>;
  }

  return (
    <div className="space-y-6">
      {message && <p className="text-sm text-accent">{message}</p>}
      {rows.map((row) => (
        <article key={row.id} className="grid gap-4 border border-border p-5 md:grid-cols-[1.4fr_0.8fr]">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-accent">{row.role}</p>
            <h2 className="display mt-2 text-4xl">
              {row.delta > 0 ? `Add ${row.delta}` : `Release ${Math.abs(row.delta)}`}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {row.required} required · {row.scheduled} scheduled · {formatMoney(row.costImpact, currency)}
            </p>
            <p className="mt-3 text-sm">{row.reasons.map((reason) => reason.label).join(" · ")}</p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <Button type="button" disabled={pending === row.id} onClick={() => act(row.id, "accepted")}>
              Accept
            </Button>
            <Button type="button" variant="outline" disabled={pending === row.id} onClick={() => act(row.id, "ignored")}>
              Ignore
            </Button>
            <label className="text-[11px] uppercase tracking-[0.16em]">
              Edit
              <input
                className="mt-2 w-20 border-b border-border bg-transparent py-1 text-base tracking-normal"
                inputMode="numeric"
                value={edits[row.id] ?? String(row.required)}
                onChange={(event) => setEdits((current) => ({ ...current, [row.id]: event.target.value }))}
              />
            </label>
            <Button type="button" variant="ghost" disabled={pending === row.id} onClick={() => act(row.id, "edited")}>
              Save edit
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
}
