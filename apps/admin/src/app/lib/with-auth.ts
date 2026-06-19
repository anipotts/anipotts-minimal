import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifySessionToken } from "@anipotts/lib/admin";
import { getEnv } from "@anipotts/lib/env";

async function requireAuth(): Promise<{ error: string } | null> {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  const secret = getEnv("ADMIN_PASSWORD");
  if (!token || !secret || !verifySessionToken(token, secret)) {
    return { error: "Unauthorized" };
  }
  return null;
}

export function withAuth<Args extends unknown[], R>(
  fn: (...args: Args) => Promise<R>,
): (...args: Args) => Promise<R | { error: string }> {
  return async (...args: Args) => {
    const authError = await requireAuth();
    if (authError) return authError;
    return fn(...args);
  };
}
