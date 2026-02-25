export function register() {
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  if (process.env.NODE_ENV !== "production") return;

  const required = ["RESEND_API_KEY"];

  const recommended = [
    "NEXT_PUBLIC_POSTHOG_KEY",
    "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
    "TURNSTILE_SECRET_KEY",
    "UPSTASH_REDIS_REST_URL",
    "UPSTASH_REDIS_REST_TOKEN",
  ];

  const missing = required.filter((v) => !process.env[v]);
  const missingRecommended = recommended.filter((v) => !process.env[v]);

  if (missing.length > 0) {
    console.error(
      `[env] Missing REQUIRED environment variables: ${missing.join(", ")}. ` +
      "The application may not function correctly."
    );
  }

  if (missingRecommended.length > 0) {
    console.warn(
      `[env] Missing recommended environment variables: ${missingRecommended.join(", ")}. ` +
      "Some features will be disabled."
    );
  }
}
