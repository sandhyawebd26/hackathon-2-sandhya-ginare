"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { RoleConfig, StaffMember } from "@/lib/domain";

export function TeamEditor({
  venueId,
  people,
  roles,
}: {
  venueId: string;
  people: StaffMember[];
  roles: RoleConfig[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [page, setPage] = useState(1);
  const active = roles.filter((role) => role.enabled);
  const pageSize = 8;
  const pages = Math.max(1, Math.ceil(people.length / pageSize));
  const currentPage = Math.min(page, pages);
  const visible = people.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-8">
      <ul className="divide-y divide-border border-y border-border">
        {visible.map((person) => (
          <li key={person.id} className="grid gap-1 py-4 md:grid-cols-3">
            <p>{person.name}</p>
            <p className="text-sm text-muted-foreground">{person.role}</p>
            <p className="text-sm text-muted-foreground">{person.maxWeeklyHours} hours a week</p>
          </li>
        ))}
      </ul>
      {pages > 1 && (
        <nav className="flex flex-wrap items-center gap-2" aria-label="Team pages">
          <button type="button" className="min-h-11 border border-border px-3 text-sm disabled:opacity-40" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>
            Previous
          </button>
          {Array.from({ length: pages }, (_, index) => index + 1).map((number) => (
            <button
              key={number}
              type="button"
              aria-current={number === currentPage ? "page" : undefined}
              className={number === currentPage ? "min-h-11 min-w-11 border border-foreground bg-foreground px-3 text-sm text-background" : "min-h-11 min-w-11 border border-border px-3 text-sm"}
              onClick={() => setPage(number)}
            >
              {number}
            </button>
          ))}
          <button type="button" className="min-h-11 border border-border px-3 text-sm disabled:opacity-40" disabled={currentPage === pages} onClick={() => setPage(currentPage + 1)}>
            Next
          </button>
        </nav>
      )}
      <form
        className="grid gap-4 border border-border p-5 md:grid-cols-3"
        onSubmit={async (event) => {
          event.preventDefault();
          setPending(true);
          setMessage("");
          const form = new FormData(event.currentTarget);
          const response = await fetch("/api/team", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              venueId,
              name: String(form.get("name") ?? ""),
              role: String(form.get("role") ?? ""),
              maxWeeklyHours: Number(form.get("hours") ?? 40),
            }),
          });
          const body = (await response.json()) as { success?: boolean; message?: string };
          setMessage(body.message ?? "");
          setPending(false);
          if (body.success) {
            event.currentTarget.reset();
            router.refresh();
          }
        }}
      >
        <label className="text-[11px] uppercase tracking-[0.16em]">
          Name
          <input name="name" required className="mt-2 w-full border-b border-border bg-transparent py-2 text-base tracking-normal normal-case" />
        </label>
        <label className="text-[11px] uppercase tracking-[0.16em]">
          Role
          <select name="role" className="menu mt-2">
            {active.map((role) => (
              <option key={role.id} value={role.role}>
                {role.role}
              </option>
            ))}
          </select>
        </label>
        <label className="text-[11px] uppercase tracking-[0.16em]">
          Weekly cap
          <input name="hours" type="number" min={4} max={60} defaultValue={40} className="mt-2 w-full border-b border-border bg-transparent py-2 text-base tracking-normal" />
        </label>
        <div className="md:col-span-3">
          <Button type="submit" disabled={pending}>
            Add to the team
          </Button>
        </div>
      </form>
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  );
}
