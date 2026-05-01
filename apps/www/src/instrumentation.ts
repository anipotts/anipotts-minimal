export function register() {
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  if (process.env.NODE_ENV !== "production") return;

  const recommended = [
    "NEXT_PUBLIC_POSTHOG_KEY",
    "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
    "TURNSTILE_SECRET_KEY",
    "UPSTASH_REDIS_REST_URL",
    "UPSTASH_REDIS_REST_TOKEN",
  ];

  const missingRecommended = recommended.filter((v) => !process.env[v]);

  if (missingRecommended.length > 0) {
    console.warn(
      `[env] Missing recommended environment variables: ${missingRecommended.join(", ")}. ` +
        "Some features will be disabled.",
    );
  }
}
