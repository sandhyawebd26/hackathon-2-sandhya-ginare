import { connection } from "next/server";
import Link from "next/link";
import { Suspense } from "react";

import { ContextBanner } from "@/components/ops/context-banner";
import { Heading } from "@/components/ops/heading";
import { StaffingBoard } from "@/components/ops/staffing-board";
import { formatDay, zonedTimeToUtc } from "@/lib/time";
import { loadStaffing } from "@/server/queries";

export const metadata = { title: "Staffing" };

export default function StaffingPage({
  searchParams,
}: {
  searchParams: Promise<{ venue?: string; date?: string }>;
}) {
  return (
    <Suspense fallback={<Heading kicker="Staffing" title="Required on the floor" />}>
      <StaffingContent searchParams={searchParams} />
    </Suspense>
  );
}

function shiftDate(date: string, days: number) {
  const next = new Date(Date.UTC(Number(date.slice(0, 4)), Number(date.slice(5, 7)) - 1, Number(date.slice(8, 10)) + days));
  return next.toISOString().slice(0, 10);
}

async function StaffingContent({
  searchParams,
}: {
  searchParams: Promise<{ venue?: string; date?: string }>;
}) {
  await connection();
  const params = await searchParams;
  const data = await loadStaffing(params.venue, params.date);
  const previous = shiftDate(data.date, -1);
  const next = shiftDate(data.date, 1);
  const link = (date: string) => `/staffing?venue=${data.venue.id}&date=${date}`;
  const [y, m, d] = data.date.split("-").map(Number);
  const dayLabel = formatDay(
    zonedTimeToUtc(y, m, d, 12, 0, data.venue.timezone).toISOString(),
    data.venue.timezone,
  );
  return (
    <>
      <Heading
        kicker="One service day"
        title="Who the hour asks for."
        copy="Each cell is required headcount for that role and hour. Green is matched, amber is short, blue is heavy."
      />
      <ContextBanner
        title={`Viewing ${dayLabel}`}
        lines={[
          `Date key ${data.date} · timezone ${data.venue.timezone}. Use Previous / Next to move day by day.`,
          "This is not the full week chart — see Forecast for seven days of predicted covers.",
          "Numbers come from the same pipeline as Events and Approvals; adding an event replans this day automatically.",
        ]}
      />
      <div className="mb-6 flex flex-wrap items-center gap-5 text-[11px] uppercase tracking-[0.18em]">
        <Link href={link(previous)}>Previous</Link>
        <Link href={link(next)}>Next</Link>
        <span className="text-optimal">Optimal</span>
        <span className="text-under">Short</span>
        <span className="text-over">Heavy</span>
      </div>
      <StaffingBoard venueId={data.venue.id} roles={data.roles} hours={data.hours} cells={data.cells} />
    </>
  );
}
