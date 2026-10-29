import { z } from "zod";

import { provisionVenue } from "@/server/auth/provision";
import { registerAccount, setSession } from "@/server/auth/session";
import { fail, ok, readJson } from "@/server/http";

const bodySchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120),
  password: z.string().min(8).max(72),
  businessType: z.enum(["hotel", "restaurant", "cafe"]),
  venueName: z.string().trim().min(2).max(80),
  city: z.string().trim().min(2).max(80),
  countryCode: z.string().trim().length(2),
});

export async function POST(request: Request) {
  try {
    const body = bodySchema.parse(await readJson(request));
    const venue = await provisionVenue({ ...body, countryCode: body.countryCode.toUpperCase() });
    const account = registerAccount({
      name: body.name,
      email: body.email,
      password: body.password,
      venueId: venue.id,
    });
    await setSession(account, venue);
    return ok({ venueId: venue.id, name: venue.name });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Could not create the account", 400);
  }
}
