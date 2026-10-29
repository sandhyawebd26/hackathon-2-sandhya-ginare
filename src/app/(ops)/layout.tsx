import { Suspense } from "react";

import { OpsChrome } from "@/components/ops/chrome";
import { resolveVenue } from "@/server/queries";

export default function OpsLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="px-6 py-16 display text-6xl">ShiftSense</div>}>
      <OpsFrame>{children}</OpsFrame>
    </Suspense>
  );
}

async function OpsFrame({ children }: { children: React.ReactNode }) {
  const { venues, account } = await resolveVenue();
  return (
    <OpsChrome
      accountName={account.name}
      venues={venues.map((venue) => ({ id: venue.id, name: venue.name, city: venue.city }))}
    >
      {children}
    </OpsChrome>
  );
}
