/// <reference types="astro/client" />

type D1PreparedStatement = {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(): Promise<T | null>;
  run(): Promise<{ results?: unknown[]; success?: boolean; meta?: unknown }>;
  all<T = unknown>(): Promise<{ results?: T[] }>;
};

type D1Database = {
  prepare(query: string): D1PreparedStatement;
};

type Runtime = import("@astrojs/cloudflare").Runtime<{
  DB: D1Database;
  PUBLIC_STATE_API: string;
  ACCESS_TEAM_DOMAIN: string;
  ACCESS_POLICY_AUD: string;
}>;

declare namespace App {
  interface Locals extends Runtime {
    passkeySessionActive?: boolean;
  }
}
