import { Suspense } from "react";

import { Heading } from "@/components/ops/heading";
import { ImportForm } from "@/components/ops/import-form";
import { resolveVenue } from "@/server/queries";

export const metadata = { title: "Import" };

export default function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ venue?: string }>;
}) {
  return (
    <Suspense fallback={<Heading kicker="Import" title="Bring the last season" />}>
      <OnboardingContent searchParams={searchParams} />
    </Suspense>
  );
}

async function OnboardingContent({ searchParams }: { searchParams: Promise<{ venue?: string }> }) {
  const { venue: venueId } = await searchParams;
  const { venue } = await resolveVenue(venueId);
  return (
    <>
      <Heading
        kicker={venue.name}
        title="Map the columns, then recalculate."
        copy="Dates are read as day/month/year. In Supabase mode the file is also kept in the imports bucket."
      />
      <ImportForm venueId={venue.id} />
    </>
  );
}
