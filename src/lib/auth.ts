import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE = "skygat_admin";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function token(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set.");
  return createHmac("sha256", secret).update("skygat-admin-v1").digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export async function isAdmin(): Promise<boolean> {
  const value = (await cookies()).get(COOKIE)?.value;
  if (!value) return false;
  try {
    return safeEqual(value, token());
  } catch {
    return false;
  }
}

/** Throws if the caller is not an unlocked admin. Call at the top of every mutation. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) throw new Error("Admin access required. Unlock with your PIN first.");
}

export async function signIn(pin: string): Promise<boolean> {
  const expected = process.env.ADMIN_PIN;
  if (!expected || !pin || !safeEqual(pin, expected)) return false;
  (await cookies()).set(COOKIE, token(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
  return true;
}

export async function signOut(): Promise<void> {
  (await cookies()).delete(COOKIE);
}
