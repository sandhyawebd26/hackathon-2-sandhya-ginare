import { Suspense } from "react";

import { ContextBanner } from "@/components/ops/context-banner";
import { EventForm } from "@/components/ops/event-form";
import { Heading } from "@/components/ops/heading";
import { SignalsBriefing } from "@/components/ops/signals-briefing";
import { addDays, formatWhen, startOfZonedDay } from "@/lib/time";
import { resolveVenue } from "@/server/queries";

export const metadata = { title: "Events" };

export default function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ venue?: string }>;
}) {
  return (
    <Suspense fallback={<Heading kicker="Events" title="What the calendar missed" />}>
      <EventsContent searchParams={searchParams} />
    </Suspense>
  );
}

async function EventsContent({ searchParams }: { searchParams: Promise<{ venue?: string }> }) {
  const { venue: venueId } = await searchParams;
  const { store, venue } = await resolveVenue(venueId);
  const from = startOfZonedDay(new Date(), venue.timezone);
  const signals = await store.listSignals(venue.id, from.toISOString(), addDays(from, 14).toISOString());
  const notable = signals.filter((signal) => signal.kind !== "weather");
  return (
    <>
      <Heading
        kicker={`${venue.city} · ${venue.countryCode}`}
        title="A note becomes a headcount."
        copy="Holidays come from the venue's country. Weather comes from Open-Meteo. Everything else is entered here, then the week is replanned."
      />
      <ContextBanner
        title="After you add an event"
        lines={[
          "1. The signal is saved with an impact multiplier on covers for overlapping hours.",
          "2. The engine replans the next 7 days: Forecast curve, Staffing required counts, and Approvals gaps.",
          "3. Roster shift names are not auto-changed — rebuild roster on the Roster page if needed.",
        ]}
      />
      <SignalsBriefing venueId={venue.id} />
      <EventForm venueId={venue.id} />
      <ul className="mt-10 divide-y divide-border border-y border-border">
        {notable.map((signal) => (
          <li key={signal.id} className="flex flex-wrap items-baseline justify-between gap-3 py-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-accent">{signal.kind}</p>
              <p className="display mt-1 text-3xl">{signal.label}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              {formatWhen(signal.startsAt, venue.timezone)} · ×{signal.impactMultiplier}
            </p>
          </li>
        ))}
      </ul>
    </>
  );
}
