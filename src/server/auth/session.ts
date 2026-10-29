import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

import type { Account, Venue } from "@/lib/domain";
import { materializeVenue } from "@/server/auth/provision";
import {
  decodeSessionBundle,
  encodeSessionBundle,
  SESSION_BUNDLE_COOKIE,
} from "@/server/auth/session-cookie";
import { findAccount, findAccountByEmail, insertAccount } from "@/server/store/memory";
import { restoreVenueSnapshot } from "@/server/store/demo-restore";
import type { DataStore } from "@/server/store/types";

const COOKIE = "ss_user";

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 32).toString("hex");
  return { salt, hash };
}

export function passwordMatches(password: string, account: Account) {
  const next = scryptSync(password, account.passwordSalt, 32);
  const prev = Buffer.from(account.passwordHash, "hex");
  if (next.length !== prev.length) return false;
  return timingSafeEqual(next, prev);
}

export async function setSession(account: Account, venue: Venue) {
  const jar = await cookies();
  jar.set(COOKIE, account.id, cookieOptions());
  if (process.env.DATA_SOURCE !== "supabase") {
    jar.set(SESSION_BUNDLE_COOKIE, encodeSessionBundle({ v: 2, account, venue }), cookieOptions());
  }
}

export async function syncDemoSessionBundle(store: DataStore, account: Account, venue: Venue) {
  if (process.env.DATA_SOURCE === "supabase") return;
  const roleConfigs = await store.listRoleConfigs(venue.id);
  const staff = await store.listStaff(venue.id);
  const horizon = new Date(Date.now() + 86_400_000 * 60).toISOString();
  const events = (await store.listSignals(venue.id, new Date(0).toISOString(), horizon)).filter(
    (row) => row.kind === "event",
  );
  const recommendationOverrides = (await store.listRecommendationOverrides(venue.id)).slice(-48);
  const jar = await cookies();
  const encoded = encodeSessionBundle({
    v: 2,
    account,
    venue,
    roleConfigs,
    staff,
    events,
    recommendationOverrides,
  });
  if (encoded.length > 3800) {
    throw new Error("Session bundle is too large; sign in again or reduce team size");
  }
  jar.set(SESSION_BUNDLE_COOKIE, encoded, cookieOptions());
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
  jar.delete(SESSION_BUNDLE_COOKIE);
}

export async function warmDemoSessionFromCookies() {
  const jar = await cookies();
  const id = jar.get(COOKIE)?.value;
  if (!id) return null;
  return rehydrateDemoSession(id);
}

async function rehydrateDemoSession(userId: string) {
  if (process.env.DATA_SOURCE === "supabase") return null;
  const jar = await cookies();
  const bundle = decodeSessionBundle(jar.get(SESSION_BUNDLE_COOKIE)?.value);
  if (!bundle || bundle.account.id !== userId) return null;

  let account = findAccount(userId);
  if (!account) {
    const byEmail = findAccountByEmail(bundle.account.email);
    if (byEmail) account = byEmail;
    else insertAccount(bundle.account);
    account = findAccount(bundle.account.id) ?? bundle.account;
  }

  if (bundle.v === 2 && (bundle.roleConfigs?.length ?? 0) > 0) {
    restoreVenueSnapshot(
      bundle.venue,
      bundle.roleConfigs ?? [],
      bundle.staff ?? [],
      bundle.events ?? [],
      bundle.recommendationOverrides ?? [],
    );
  }
  await materializeVenue(bundle.venue);
  return account;
}

export async function currentAccount() {
  const jar = await cookies();
  const id = jar.get(COOKIE)?.value;
  if (!id) return null;
  const found = findAccount(id);
  if (found) return found;
  return rehydrateDemoSession(id);
}

export async function requireAccount() {
  const account = await currentAccount();
  if (!account) throw new Error("Sign in required");
  return account;
}

export function registerAccount(input: { name: string; email: string; password: string; venueId: string }) {
  const email = input.email.trim().toLowerCase();
  if (findAccountByEmail(email)) throw new Error("An account with that email already exists");
  const { salt, hash } = hashPassword(input.password);
  return insertAccount({
    id: crypto.randomUUID(),
    email,
    name: input.name.trim(),
    passwordHash: hash,
    passwordSalt: salt,
    venueIds: [input.venueId],
  });
}

export function authenticate(email: string, password: string) {
  const account = findAccountByEmail(email);
  if (!account || !passwordMatches(password, account)) return null;
  return account;
}
