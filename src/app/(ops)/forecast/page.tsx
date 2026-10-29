import { Suspense } from "react";

import { DemandChart } from "@/components/ops/demand-chart";
import { Heading } from "@/components/ops/heading";
import { loadDashboard } from "@/server/queries";

export const metadata = { title: "Forecast" };

export default function ForecastPage({
  searchParams,
}: {
  searchParams: Promise<{ venue?: string }>;
}) {
  return (
    <Suspense fallback={<Heading kicker="Forecast" title="The week, hour by hour" />}>
      <ForecastContent searchParams={searchParams} />
    </Suspense>
  );
}

async function ForecastContent({ searchParams }: { searchParams: Promise<{ venue?: string }> }) {
  const { venue: venueId } = await searchParams;
  const data = await loadDashboard(venueId);
  const peaks = [...data.hourly].sort((a, b) => b.predicted - a.predicted).slice(0, 4);
  return (
    <>
      <Heading
        kicker="Forecast"
        title="Where the room fills."
        copy="A weighted cyclical average of the same weekday and hour, then weather, holidays, events, and reservations."
      />
      <section className="border border-border p-5">
        <DemandChart points={data.hourly.map((point) => ({ label: point.label, predicted: point.predicted }))} />
      </section>
      <ol className="mt-8 grid gap-4 md:grid-cols-4">
        {peaks.map((peak, index) => (
          <li key={peak.hourStart} className="border border-border p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-accent">0{index + 1}</p>
            <p className="display mt-3 text-4xl">{peak.predicted}</p>
            <p className="mt-2 text-sm text-muted-foreground">{peak.label}</p>
          </li>
        ))}
      </ol>
    </>
  );
}
