import { z } from "zod";

import { authenticate, setSession, syncDemoSessionBundle, warmDemoSessionFromCookies } from "@/server/auth/session";
import { fail, ok, readJson } from "@/server/http";
import { memoryStore } from "@/server/store/memory";

const bodySchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = bodySchema.parse(await readJson(request));
    await warmDemoSessionFromCookies();
    const account = authenticate(body.email, body.password);
    if (!account) return fail("Email or password is incorrect", 401);
    const venueId = account.venueIds[0];
    const venue = venueId ? await memoryStore.getVenue(venueId) : null;
    if (!venue) return fail("Your venue is not available on this server. Sign up again or use Supabase mode.", 503);
    await setSession(account, venue);
    await syncDemoSessionBundle(memoryStore, account, venue);
    return ok({ name: account.name });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Could not sign in", 400);
  }
}
