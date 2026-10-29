import { Suspense } from "react";

import { Heading } from "@/components/ops/heading";
import { RoleEditor } from "@/components/ops/role-editor";
import { resolveVenue } from "@/server/queries";

export const metadata = { title: "Roles" };

export default function RolesPage({ searchParams }: { searchParams: Promise<{ venue?: string }> }) {
  return (
    <Suspense fallback={<Heading kicker="Roles" title="Who you employ" />}>
      <RolesContent searchParams={searchParams} />
    </Suspense>
  );
}

async function RolesContent({ searchParams }: { searchParams: Promise<{ venue?: string }> }) {
  const { venue: venueId } = await searchParams;
  const { store, venue } = await resolveVenue(venueId);
  const roles = await store.listRoleConfigs(venue.id);
  const label = venue.venueType === "cafe" ? "Café" : venue.venueType === "hotel" ? "Hotel" : "Restaurant";
  return (
    <>
      <Heading
        kicker={label}
        title="Roles on this team."
        copy="Turn a role off when you do not use it. Add a custom role when the default list is missing someone. Only active roles are rostered."
      />
      <RoleEditor venueId={venue.id} roles={roles} />
    </>
  );
}
