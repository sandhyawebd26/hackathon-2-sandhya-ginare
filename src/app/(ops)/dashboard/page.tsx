import Link from "next/link";
import { Suspense } from "react";

import { DemandChart } from "@/components/ops/demand-chart";
import { Heading } from "@/components/ops/heading";
import { WeekBriefing } from "@/components/ops/week-briefing";
import { formatMoney } from "@/lib/time";
import { loadDashboard } from "@/server/queries";

export const metadata = { title: "Dashboard" };

export default function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ venue?: string }>;
}) {
  return (
    <Suspense fallback={<Heading kicker="Dashboard" title="Reading the week" />}>
      <DashboardContent searchParams={searchParams} />
    </Suspense>
  );
}

async function DashboardContent({ searchParams }: { searchParams: Promise<{ venue?: string }> }) {
  const { venue: venueId } = await searchParams;
  const data = await loadDashboard(venueId);
  const query = `?venue=${data.venue.id}`;
  return (
    <>
      <Heading
        kicker={`${data.venue.city} · ${data.venue.name}`}
        title="The next seven services."
        copy="Demand is a cover-hour index: each hour is predicted on its own, then summed for the day. It is workload, not unique guests."
      />
      <WeekBriefing venueId={data.venue.id} />
      <dl className="mb-10 grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Peak", data.peak ? `${data.peak.covers} covers` : "—", data.peak?.label ?? ""],
          ["Short", String(data.under), "Hours under the roster"],
          ["Heavy", String(data.over), "Hours over the roster"],
          ["To add", formatMoney(data.extraCost, data.venue.currency), "If every short hour is filled"],
        ].map(([label, value, note]) => (
          <div key={label} className="bg-background p-5">
            <dt className="text-[11px] uppercase tracking-[0.2em] text-accent">{label}</dt>
            <dd className="display mt-3 text-3xl sm:text-4xl">{value}</dd>
            <p className="mt-2 text-sm text-muted-foreground">{note}</p>
          </div>
        ))}
      </dl>
      <section className="min-w-0 overflow-hidden border border-border p-4 sm:p-5">
        <p className="mb-4 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Daily demand</p>
        <DemandChart points={data.daily.map((point) => ({ label: point.day.slice(5), predicted: point.predicted }))} />
      </section>
      <div className="mt-8 flex flex-wrap gap-6 text-[11px] uppercase tracking-[0.18em]">
        <Link href={`/staffing${query}`}>Open the staffing matrix</Link>
        <Link href={`/recommendations${query}`}>Review gaps</Link>
        <Link href={`/forecast${query}`}>Hourly forecast</Link>
      </div>
      {data.alerts.filter((alert) => !alert.readAt).length > 0 && (
        <ul className="mt-10 space-y-3 border-t border-border pt-6">
          {data.alerts.filter((alert) => !alert.readAt).slice(0, 3).map((alert) => (
            <li key={alert.id} className="text-sm">
              <span className="mr-3 text-[11px] uppercase tracking-[0.16em] text-accent">{alert.severity}</span>
              {alert.message}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
