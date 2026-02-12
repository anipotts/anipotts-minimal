export function register() {
  if (process.env.NEXT_PHASE === "phase-production-build") return;

  const required = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ];

  const recommended = [
    "ADMIN_PASSWORD",
    "SUPABASE_SERVICE_ROLE_KEY",
    "RESEND_API_KEY",
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
