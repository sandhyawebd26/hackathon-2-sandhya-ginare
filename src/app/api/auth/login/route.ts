import { z } from "zod";

import { authenticate, setSession } from "@/server/auth/session";
import { fail, ok, readJson } from "@/server/http";

const bodySchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = bodySchema.parse(await readJson(request));
    const account = authenticate(body.email, body.password);
    if (!account) return fail("Email or password is incorrect", 401);
    await setSession(account.id);
    return ok({ name: account.name });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Could not sign in", 400);
  }
}
