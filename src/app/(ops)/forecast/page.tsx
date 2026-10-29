import { Suspense } from "react";

import { ContextBanner } from "@/components/ops/context-banner";
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
  const driverLines = [
    `Window: ${data.weekRangeLabel} (${data.venue.timezone}).`,
    "Each point is predicted guest covers for one opening hour — not headcount on the floor.",
    data.drivers.holidays.length
      ? `Holidays in window: ${data.drivers.holidays.join(", ")}.`
      : "No public holidays in this window.",
    data.drivers.events.length
      ? `Events boosting demand: ${data.drivers.events.join(", ")}.`
      : "No manual events in this window — add them under Events.",
    data.drivers.weatherSlots
      ? `Weather adjustments applied across ${data.drivers.weatherSlots} hourly slots.`
      : "Weather data not loaded yet for this window.",
    "Staffing and Approvals use the same numbers to size each role per hour.",
  ];
  return (
    <>
      <Heading
        kicker="Predicted covers"
        title="Where the room fills."
        copy="History for the same weekday and hour (WCMA), multiplied by holidays, weather, events, and reservations."
      />
      <ContextBanner title="What you are looking at" lines={driverLines} />
      <section className="min-w-0 overflow-hidden border border-border p-4 sm:p-5">
        <DemandChart points={data.hourly.map((point) => ({ label: point.label, predicted: point.predicted }))} />
      </section>
      <p className="mt-4 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Busiest opening hours</p>
      <ol className="mt-3 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {peaks.map((peak, index) => (
          <li key={peak.hourStart} className="border border-border p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-accent">0{index + 1}</p>
            <p className="display mt-3 text-4xl">{peak.predicted}</p>
            <p className="mt-2 text-sm text-muted-foreground">{peak.label} · covers</p>
          </li>
        ))}
      </ol>
    </>
  );
}
