import { formatWhen } from "@/lib/time";
import type { Recommendation } from "@/lib/domain";

export function DecisionsList({
  rows,
  timezone,
}: {
  rows: Recommendation[];
  timezone: string;
}) {
  if (!rows.length) return null;
  return (
    <section className="mt-10 border-t border-border pt-8">
      <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Recent decisions</p>
      <ul className="mt-4 divide-y divide-border border-y border-border">
        {rows.map((row) => (
          <li key={row.id} className="flex flex-wrap items-baseline justify-between gap-2 py-3 text-sm">
            <span>
              <span className="text-accent uppercase tracking-[0.12em]">{row.status}</span>
              {" · "}
              {row.role} · {formatWhen(row.hourStart, timezone)}
            </span>
            <span className="text-muted-foreground">
              {row.required} required · {row.scheduled} scheduled
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
