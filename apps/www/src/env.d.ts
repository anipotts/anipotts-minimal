/// <reference types="astro/client" />

type CfEnv = {
  DB: D1Database;
  ASSETS: Fetcher;
  RESEND_API_KEY?: string;
  BUTTONDOWN_API_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
};

type Runtime = import("@astrojs/cloudflare").Runtime<CfEnv>;

declare namespace App {
  interface Locals extends Runtime {}
}
