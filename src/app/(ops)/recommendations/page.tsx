import { Suspense } from "react";

import { ApprovalList } from "@/components/ops/approval-list";
import { Heading } from "@/components/ops/heading";
import { addDays, startOfZonedDay } from "@/lib/time";
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
  const { venue: venueId } = await searchParams;
  const { store, venue } = await resolveVenue(venueId);
  const from = startOfZonedDay(new Date(), venue.timezone);
  const to = addDays(from, 7);
  await ensurePipeline(store, venue, from);
  const rows = (await store.listRecommendations(venue.id, from.toISOString(), to.toISOString()))
    .filter((row) => row.status === "pending" && row.delta !== 0)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 16);
  return (
    <>
      <Heading
        kicker="Human in the loop"
        title="Accept, edit, or leave it."
        copy="Overrides are stored with the recommendation. The model does not invent the headcount."
      />
      <ApprovalList rows={rows} currency={venue.currency} />
    </>
  );
}
