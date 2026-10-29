"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";

import type { Reason, RecommendationStatus } from "@/lib/domain";
import { staffingCellExplanation } from "@/lib/explain-fallback";
import { cn } from "@/lib/utils";

type Cell = {
  id: string;
  hourStart: string;
  role: string;
  required: number;
  scheduled: number;
  delta: number;
  tone: "optimal" | "under" | "over";
  label: string;
  status: RecommendationStatus;
  reasons: Reason[];
};

const toneClass = {
  optimal: "bg-optimal/15 text-optimal",
  under: "bg-under/20 text-under",
  over: "bg-over/20 text-over",
};

export function StaffingBoard({
  venueId,
  roles,
  hours,
  cells,
}: {
  venueId: string;
  roles: string[];
  hours: string[];
  cells: Cell[];
}) {
  const [active, setActive] = useState<Cell | null>(null);
  const [copy, setCopy] = useState("");
  const [source, setSource] = useState<"template" | "gemini" | "">("");
  const lookup = new Map(cells.map((cell) => [`${cell.role}|${cell.hourStart}`, cell]));

  async function open(cell: Cell) {
    setActive(cell);
    setCopy("Reading the drivers…");
    setSource("");
    const response = await fetch("/api/ai/explain", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recommendationId: cell.id, venueId }),
    });
    const body = (await response.json()) as {
      success?: boolean;
      message?: string;
      data?: { text: string; source: "template" | "gemini" };
    };
    if (body.success && body.data?.text) {
      setCopy(body.data.text);
      setSource(body.data.source);
      return;
    }
    setCopy(staffingCellExplanation(cell));
    setSource("template");
  }

  return (
    <>
      <div className="overflow-x-auto border border-border">
        <table className="min-w-full border-collapse text-left">
          <thead>
            <tr>
              <th className="sticky left-0 bg-background px-3 py-3 text-[11px] uppercase tracking-[0.16em]">Role</th>
              {hours.map((hour) => (
                <th key={hour} className="px-2 py-3 text-[11px] font-normal text-muted-foreground">
                  {lookup.get(`${roles[0]}|${hour}`)?.label.split(" ").slice(-1)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => (
              <tr key={role} className="border-t border-border">
                <th className="sticky left-0 bg-background px-3 py-3 text-[11px] uppercase tracking-[0.16em] font-normal">
                  {role}
                </th>
                {hours.map((hour) => {
                  const cell = lookup.get(`${role}|${hour}`);
                  if (!cell) return <td key={hour} />;
                  return (
                    <td key={hour} className="p-1">
                      <button
                        type="button"
                        onClick={() => open(cell)}
                        className={cn("display w-14 py-3 text-2xl", toneClass[cell.tone])}
                        aria-label={`${role} at ${cell.label}, ${cell.required} required, ${cell.scheduled} scheduled`}
                      >
                        {cell.required}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Dialog.Root open={Boolean(active)} onOpenChange={(openState) => !openState && setActive(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-hero/60" />
          <Dialog.Content className="fixed inset-x-0 bottom-0 max-h-[90dvh] w-full overflow-y-auto border-t border-border bg-background p-6 sm:inset-y-0 sm:inset-x-auto sm:right-0 sm:max-h-none sm:max-w-md sm:border-l sm:border-t-0 sm:p-8">
            <p className="text-[11px] uppercase tracking-[0.28em] text-accent">Explain this hour</p>
            <Dialog.Title className="display mt-3 text-4xl leading-none sm:text-5xl">
              {active?.role} · {active?.required}
            </Dialog.Title>
            <Dialog.Description className="mt-4 text-sm leading-7 text-muted-foreground">
              {active?.label}. {active?.scheduled} already on the roster.
              {source === "gemini" ? " Written with Gemini." : " Written from the forecast drivers."}
            </Dialog.Description>
            <p className="mt-6 text-sm leading-7">{copy}</p>
            <ul className="mt-8 space-y-4">
              {active?.reasons.map((reason) => (
                <li key={reason.code}>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-accent">{reason.label}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{reason.detail}</p>
                </li>
              ))}
            </ul>
            <Dialog.Close className="mt-10 text-[11px] uppercase tracking-[0.2em]">Close</Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
