/// <reference types="astro/client" />
/// <reference types="@cloudflare/workers-types" />

type D1PreparedStatement = {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(): Promise<T | null>;
  run(): Promise<{ results?: unknown[]; success?: boolean; meta?: unknown }>;
  all<T = unknown>(): Promise<{ results?: T[] }>;
};

type D1Database = {
  prepare(query: string): D1PreparedStatement;
};

declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    PUBLIC_STATE_API: string;
    ACCESS_TEAM_DOMAIN: string;
    ACCESS_POLICY_AUD: string;
  }
}

declare namespace App {
  interface Locals {
    passkeySessionActive?: boolean;
  }
}
