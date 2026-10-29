"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ActionFeedback, type ActionFeedbackState } from "@/components/ops/action-feedback";
import { Button } from "@/components/ui/button";
import type { Recommendation } from "@/lib/domain";
import { formatMoney } from "@/lib/time";

const clientMessages = {
  accepted: "Accepted — this gap is cleared from your queue.",
  ignored: "Ignored — this gap is cleared from your queue.",
  edited: "Headcount saved — this gap is cleared from your queue.",
} as const;

export function ApprovalList({
  venueId,
  weekLabel,
  rows: initialRows,
  currency,
}: {
  venueId: string;
  weekLabel: string;
  rows: (Recommendation & { whenLabel: string })[];
  currency: string;
}) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [pending, setPending] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<ActionFeedbackState>(null);

  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

  async function act(id: string, action: "accepted" | "edited" | "ignored") {
    setPending(id);
    setFeedback(null);
    const editedRaw = edits[id] ?? "";
    const editedRequired = action === "edited" ? Number(editedRaw) : undefined;
    if (action === "edited" && (!Number.isFinite(editedRequired) || editedRequired! < 0)) {
      setFeedback({ tone: "error", text: "Enter a valid headcount before saving an edit." });
      setPending(null);
      return;
    }
    const response = await fetch(`/api/recommendations/${id}/action`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        venueId,
        action,
        editedRequired: action === "edited" ? editedRequired : undefined,
        notes: action === "edited" ? "Manager override" : undefined,
      }),
    });
    const body = (await response.json()) as { message?: string; success?: boolean };
    if (body.success) {
      setRows((current) => current.filter((row) => row.id !== id));
      setFeedback({ tone: "success", text: body.message ?? clientMessages[action] });
      router.refresh();
    } else {
      setFeedback({
        tone: "error",
        text: body.message ?? `Could not update this gap (HTTP ${response.status}). Refresh and try again.`,
      });
    }
    setPending(null);
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Showing staffing gaps for <span className="text-foreground">{weekLabel}</span>. Each row is one role at one
        service hour.
      </p>
      <ActionFeedback feedback={feedback} />
      {!rows.length ? (
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>No open gaps in this window.</p>
          <p>
            Check <Link href={`/staffing?venue=${venueId}`}>Staffing</Link> for the full matrix or add an{" "}
            <Link href={`/events?venue=${venueId}`}>Event</Link> to replan demand.
          </p>
        </div>
      ) : null}
      {rows.map((row) => (
        <article key={row.id} className="grid gap-6 border border-border p-5 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-accent">{row.whenLabel}</p>
            <p className="mt-1 text-sm text-muted-foreground">{row.role}</p>
            <h2 className="display mt-2 text-3xl sm:text-4xl">
              {row.delta > 0 ? `Add ${row.delta}` : `Release ${Math.abs(row.delta)}`}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {row.required} required · {row.scheduled} scheduled · {formatMoney(row.costImpact, currency)}
            </p>
            <p className="mt-3 text-sm">
              <span className="text-[11px] uppercase tracking-[0.14em] text-accent">Drivers · </span>
              {row.reasons.map((reason) => reason.label).join(" · ")}
            </p>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="flex flex-wrap gap-3">
              <Button type="button" disabled={pending === row.id} onClick={() => act(row.id, "accepted")}>
                Accept
              </Button>
              <Button type="button" variant="outline" disabled={pending === row.id} onClick={() => act(row.id, "ignored")}>
                Ignore
              </Button>
            </div>
            <div className="flex flex-wrap items-end gap-3 border-t border-border pt-4 sm:border-0 sm:pt-0">
              <label className="min-w-[7rem] text-[11px] uppercase tracking-[0.16em]">
                Edit required
                <input
                  className="mt-2 w-full min-w-[4rem] max-w-[6rem] border-b border-border bg-transparent py-2 text-base tracking-normal"
                  inputMode="numeric"
                  aria-label={`Required headcount for ${row.role}`}
                  value={edits[row.id] ?? String(row.required)}
                  onChange={(event) => setEdits((current) => ({ ...current, [row.id]: event.target.value }))}
                />
              </label>
              <Button type="button" variant="outline" disabled={pending === row.id} onClick={() => act(row.id, "edited")}>
                Save edit
              </Button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
