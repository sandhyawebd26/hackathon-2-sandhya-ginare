import { createHmac, timingSafeEqual } from "crypto";

import type { Account, Venue } from "@/lib/domain";

const BUNDLE = "ss_bundle";

export type SessionBundle = {
  v: 1;
  account: Account;
  venue: Venue;
};

function secret() {
  const key =
    process.env.SESSION_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim() ||
    process.env.SUPABASE_JWT_SECRET?.trim();
  if (key) return key;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "SESSION_SECRET or CRON_SECRET is required in production (enable for Production, not Preview only)",
    );
  }
  return "shiftsense-dev-session";
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function encodeSessionBundle(bundle: SessionBundle) {
  const payload = Buffer.from(JSON.stringify(bundle), "utf8").toString("base64url");
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

export function decodeSessionBundle(raw: string | undefined): SessionBundle | null {
  if (!raw) return null;
  const [payload, signature] = raw.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as SessionBundle;
    if (parsed.v !== 1 || !parsed.account?.id || !parsed.venue?.id) return null;
    return parsed;
  } catch {
    return null;
  }
}

export { BUNDLE as SESSION_BUNDLE_COOKIE };
