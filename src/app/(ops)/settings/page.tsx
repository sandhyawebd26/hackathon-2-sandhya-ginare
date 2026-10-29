import { Suspense } from "react";

import { Heading } from "@/components/ops/heading";
import { formatMoney } from "@/lib/time";
import { loadSettings } from "@/server/queries";

export const metadata = { title: "House" };

export default function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ venue?: string }>;
}) {
  return (
    <Suspense fallback={<Heading kicker="House" title="How this room is staffed" />}>
      <SettingsContent searchParams={searchParams} />
    </Suspense>
  );
}

async function SettingsContent({ searchParams }: { searchParams: Promise<{ venue?: string }> }) {
  const { venue: venueId } = await searchParams;
  const data = await loadSettings(venueId);
  return (
    <>
      <Heading
        kicker={data.dataSource === "demo" ? "This server" : "Supabase"}
        title={data.venue.name}
        copy={`${data.venue.city} · ${data.venue.countryCode} · ${data.venue.timezone}. Open ${data.venue.openingHour}:00 to ${data.venue.closingHour}:00. Weekly hour caps are warnings, not a labour-law engine.`}
      />
      <ul className="divide-y divide-border border-y border-border">
        {data.configs.map((config) => (
          <li key={config.id} className="grid gap-2 py-4 md:grid-cols-4">
            <p className="uppercase tracking-[0.16em] text-[11px]">{config.role}</p>
            <p className="text-sm text-muted-foreground">{config.metric}</p>
            <p className="text-sm">{config.coversPerStaffHour} per person / hour</p>
            <p className="text-sm">{formatMoney(config.hourlyCost, data.venue.currency)}</p>
          </li>
        ))}
      </ul>
      {data.jobs.length > 0 && (
        <ul className="mt-8 space-y-2 text-sm text-muted-foreground">
          {data.jobs.map((job) => (
            <li key={job.id}>
              {job.filename} · {job.rowCount} rows · {job.status}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
