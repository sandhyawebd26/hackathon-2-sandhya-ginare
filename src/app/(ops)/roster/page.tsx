import { Suspense } from "react";

import { Heading } from "@/components/ops/heading";
import { Pager } from "@/components/ops/pager";
import { RebuildRoster } from "@/components/ops/rebuild-roster";
import { loadRoster } from "@/server/queries";

const PAGE_SIZE = 8;

export const metadata = { title: "Roster" };

export default function RosterPage({
  searchParams,
}: {
  searchParams: Promise<{ venue?: string; page?: string }>;
}) {
  return (
    <Suspense fallback={<Heading kicker="Roster" title="Who is already on" />}>
      <RosterContent searchParams={searchParams} />
    </Suspense>
  );
}

async function RosterContent({ searchParams }: { searchParams: Promise<{ venue?: string; page?: string }> }) {
  const { venue: venueId, page: pageParam } = await searchParams;
  const data = await loadRoster(venueId);
  const pages = Math.max(1, Math.ceil(data.shifts.length / PAGE_SIZE));
  const page = Math.min(pages, Math.max(1, Number(pageParam) || 1));
  const visible = data.shifts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  function hrefFor(nextPage: number) {
    const query = new URLSearchParams();
    query.set("venue", data.venue.id);
    if (nextPage > 1) query.set("page", String(nextPage));
    return `/roster?${query.toString()}`;
  }
  return (
    <>
      <Heading
        kicker="Roster"
        title="The week, by name."
        copy="Shifts are drafted from predicted rush and the people who hold each role. Rebuild the week after you change the team. Hours above a weekly cap are flagged."
      />
      <RebuildRoster venueId={data.venue.id} />
      {data.flags.length > 0 && (
        <ul className="mb-8 space-y-2 border border-border p-5 text-sm">
          {data.flags.map((person) => (
            <li key={person.name}>
              {person.name} · {person.role} · {person.hours}h scheduled, cap {person.max}h
            </li>
          ))}
        </ul>
      )}
      <ul className="divide-y divide-border border-y border-border">
        {visible.map((shift) => (
          <li key={shift.id} className="grid gap-2 py-4 md:grid-cols-[180px_1fr_180px]">
            <p className="text-[11px] uppercase tracking-[0.16em] text-accent">{shift.role}</p>
            <p>{shift.staffName}</p>
            <p className="text-sm text-muted-foreground">{shift.when}</p>
          </li>
        ))}
        {visible.length === 0 && <li className="py-6 text-sm text-muted-foreground">No shifts drafted for this week yet.</li>}
      </ul>
      <Pager page={page} pages={pages} hrefFor={hrefFor} />
    </>
  );
}
