/**
 * Environment variable accessor for CF Workers + local dev.
 *
 * Wrangler secrets are NOT exposed via process.env at runtime on CF Workers.
 * They live on the request context provided by @opennextjs/cloudflare.
 * This helper checks CF context first, falls back to process.env.
 */

export function getEnv(key: string): string | undefined {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCloudflareContext } = require("@opennextjs/cloudflare");
    const ctx = getCloudflareContext();
    const val = ctx?.env?.[key];
    if (typeof val === "string" && val.length > 0) return val;
  } catch {
    // Not in CF runtime (local dev), fall through
  }

  return process.env[key] || undefined;
}
