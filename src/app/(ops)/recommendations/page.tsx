import { connection } from "next/server";
import { Suspense } from "react";

import { ApprovalList } from "@/components/ops/approval-list";
import { DecisionsList } from "@/components/ops/decisions-list";
import { Heading } from "@/components/ops/heading";
import { addDays, formatDay, formatWhen, startOfZonedDay } from "@/lib/time";
import { ensurePipeline } from "@/server/pipeline";
import { resolveVenue } from "@/server/queries";

export const metadata = { title: "Approvals" };

export default function RecommendationsPage({
  searchParams,
}: {
  searchParams: Promise<{ venue?: string }>;
}) {
  return (
    <Suspense fallback={<Heading kicker="Approvals" title="Nothing moves without you" />}>
      <RecommendationsContent searchParams={searchParams} />
    </Suspense>
  );
}

async function RecommendationsContent({
  searchParams,
}: {
  searchParams: Promise<{ venue?: string }>;
}) {
  await connection();
  const { venue: venueId } = await searchParams;
  const { store, venue } = await resolveVenue(venueId);
  const from = startOfZonedDay(new Date(), venue.timezone);
  const to = addDays(from, 7);
  await ensurePipeline(store, venue, from);
  const fromIso = from.toISOString();
  const toIso = to.toISOString();
  const all = await store.listRecommendations(venue.id, fromIso, toIso);
  const rows = all
    .filter((row) => row.status === "pending" && row.delta !== 0)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 16)
    .map((row) => ({ ...row, whenLabel: formatWhen(row.hourStart, venue.timezone) }));
  const decided = all
    .filter((row) => row.status !== "pending")
    .sort((a, b) => b.hourStart.localeCompare(a.hourStart))
    .slice(0, 10);
  const weekLabel = `${formatDay(fromIso, venue.timezone)} → ${formatDay(addDays(from, 6).toISOString(), venue.timezone)}`;
  return (
    <>
      <Heading
        kicker="Human in the loop"
        title="Accept, edit, or leave it."
        copy="Each row is one role at one hour where scheduled staff ≠ required. Accept or ignore clears the queue; Save edit sets a new required count."
      />
      <ApprovalList venueId={venue.id} weekLabel={weekLabel} rows={rows} currency={venue.currency} />
      <DecisionsList rows={decided} timezone={venue.timezone} />
    </>
  );
}
