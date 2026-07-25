/// <reference types="astro/client" />
/// <reference types="@cloudflare/workers-types" />

declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    ASSETS: Fetcher;
    RESEND_API_KEY?: string;
    RESEND_WEBHOOK_SECRET?: string;
    NEWSLETTER_QUEUE?: Queue<{
      type: "confirm" | "issue_delivery";
      subscriberId?: string;
      email?: string;
      token?: string;
      baseUrl?: string;
      deliveryId?: string;
      issueId?: string;
    }>;
    NEWSLETTER_BASE_URL?: string;
    NEWSLETTER_FROM?: string;
    NEWSLETTER_REPLY_TO?: string;
    NEWSLETTER_MAILING_ADDRESS?: string;
  }
}

interface Window {
  posthog?: {
    capture?: (event: string, properties?: Record<string, unknown>) => void;
  };
}

declare namespace App {
  interface Locals {}
}
