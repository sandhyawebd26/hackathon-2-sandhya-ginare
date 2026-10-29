import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

import type { Account } from "@/lib/domain";
import { findAccount, findAccountByEmail, insertAccount } from "@/server/store/memory";

const COOKIE = "ss_user";

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

export async function setSession(userId: string) {
  const jar = await cookies();
  jar.set(COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function currentAccount() {
  const jar = await cookies();
  const id = jar.get(COOKIE)?.value;
  if (!id) return null;
  return findAccount(id);
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
