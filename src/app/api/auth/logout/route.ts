import { clearSession } from "@/server/auth/session";
import { ok } from "@/server/http";

export async function POST() {
  await clearSession();
  return ok({ signedOut: true });
}
