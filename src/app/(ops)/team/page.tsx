import { Suspense } from "react";

import { Heading } from "@/components/ops/heading";
import { TeamEditor } from "@/components/ops/team-editor";
import { resolveVenue } from "@/server/queries";

export const metadata = { title: "Team" };

export default function TeamPage({ searchParams }: { searchParams: Promise<{ venue?: string }> }) {
  return (
    <Suspense fallback={<Heading kicker="Team" title="People on the floor" />}>
      <TeamContent searchParams={searchParams} />
    </Suspense>
  );
}

async function TeamContent({ searchParams }: { searchParams: Promise<{ venue?: string }> }) {
  const { venue: venueId } = await searchParams;
  const { store, venue } = await resolveVenue(venueId);
  const [people, roles] = await Promise.all([store.listStaff(venue.id), store.listRoleConfigs(venue.id)]);
  return (
    <>
      <Heading
        kicker={venue.name}
        title="The people who can be rostered."
        copy="Each person holds one role and a weekly hour cap. The week is filled from this list."
      />
      <TeamEditor venueId={venue.id} people={people} roles={roles} />
    </>
  );
}
