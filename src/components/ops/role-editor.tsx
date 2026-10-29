"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { RoleConfig } from "@/lib/domain";

export function RoleEditor({ venueId, roles }: { venueId: string; roles: RoleConfig[] }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function save(role: RoleConfig, options?: { refresh?: boolean }) {
    setPending(true);
    setMessage("");
    const response = await fetch("/api/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...role, venueId }),
    });
    const body = (await response.json()) as { message?: string; success?: boolean };
    const ok = Boolean(body.success);
    setMessage(ok ? (body.message ?? "Saved") : (body.message ?? "Could not save the role"));
    setPending(false);
    if (ok && options?.refresh !== false) router.refresh();
    return ok;
  }

  return (
    <div className="space-y-8">
      <ul className="divide-y divide-border border-y border-border">
        {roles.map((role) => (
          <li key={role.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-accent">{role.department}</p>
              <p className="mt-1 text-lg">{role.role}</p>
              <p className="text-sm text-muted-foreground">
                {role.coversPerStaffHour} {role.metric} per person each hour
                {role.isCustom ? " · custom" : ""}
              </p>
            </div>
            <Button type="button" variant={role.enabled ? "outline" : "solid"} disabled={pending} onClick={() => save({ ...role, enabled: !role.enabled })}>
              {role.enabled ? "Turn off" : "Turn on"}
            </Button>
          </li>
        ))}
      </ul>
      <form
        className="grid gap-4 border border-border p-5 md:grid-cols-2"
        onSubmit={async (event) => {
          event.preventDefault();
          const formEl = event.currentTarget;
          const form = new FormData(formEl);
          const ok = await save(
            {
              id: crypto.randomUUID(),
              venueId,
              role: String(form.get("role") ?? ""),
              department: String(form.get("department") ?? ""),
              metric: String(form.get("metric") ?? "covers") as RoleConfig["metric"],
              coversPerStaffHour: Number(form.get("ratio") ?? 20),
              hourlyCost: Number(form.get("cost") ?? 15),
              enabled: true,
              isCustom: true,
            },
            { refresh: false },
          );
          if (ok) {
            formEl.reset();
            router.refresh();
          }
        }}
      >
        <p className="md:col-span-2 text-[11px] uppercase tracking-[0.18em] text-accent">Custom role</p>
        <label className="text-[11px] uppercase tracking-[0.16em]">
          Name
          <input name="role" required className="mt-2 w-full border-b border-border bg-transparent py-2 text-base tracking-normal normal-case" />
        </label>
        <label className="text-[11px] uppercase tracking-[0.16em]">
          Department
          <input name="department" required className="mt-2 w-full border-b border-border bg-transparent py-2 text-base tracking-normal normal-case" />
        </label>
        <label className="text-[11px] uppercase tracking-[0.16em]">
          Measured by
          <select name="metric" className="menu mt-2">
            <option value="covers">Covers</option>
            <option value="orders">Orders</option>
          </select>
        </label>
        <label className="text-[11px] uppercase tracking-[0.16em]">
          Per person each hour
          <input name="ratio" type="number" min={1} defaultValue={20} className="mt-2 w-full border-b border-border bg-transparent py-2 text-base tracking-normal" />
        </label>
        <div className="md:col-span-2">
          <Button type="submit" disabled={pending}>
            Add role
          </Button>
        </div>
      </form>
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  );
}
