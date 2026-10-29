import { Suspense } from "react";

import { ShiftSenseLogo } from "@/components/brand/logo";
import { OpsChrome } from "@/components/ops/chrome";
import { resolveVenue } from "@/server/queries";

export default function OpsLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="flex min-h-dvh items-center justify-center px-6 py-16"><ShiftSenseLogo href="/dashboard" size="lg" /></div>}>
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
