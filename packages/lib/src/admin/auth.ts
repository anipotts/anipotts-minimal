/**
 * Shared admin authentication helpers.
 * Each Next.js app wraps these in its own "use server" actions.ts
 * to handle cookies (which are framework-specific).
 */

/** Cookie name used across all admin sessions */
export const ADMIN_COOKIE = "admin_session";

/** Cookie options for admin session */
export const ADMIN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "strict" as const,
};

/**
 * Verify a password against the provided admin password.
 * The caller (server action) should pass process.env.ADMIN_PASSWORD
 * to ensure proper Next.js env loading in monorepo setups.
 */
export function verifyAdminPassword(
  password: string,
  adminPassword: string | undefined
): {
  success: boolean;
  error?: string;
} {
  if (!adminPassword) {
    return { success: false, error: "Admin password not configured on server" };
  }
  if (password === adminPassword) {
    return { success: true };
  }
  return { success: false, error: "Invalid password" };
}
