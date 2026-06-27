/**
 * Process environment accessor for local scripts and Node-backed tooling.
 * Cloudflare Workers should read request-local bindings directly from the
 * framework runtime and pass values into shared helpers explicitly.
 */

export function getEnv(key: string): string | undefined {
  return process.env[key] || undefined;
}
