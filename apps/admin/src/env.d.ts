/// <reference types="astro/client" />

type D1PreparedStatement = {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(): Promise<T | null>;
  run(): Promise<{
    results?: unknown[];
    success?: boolean;
    meta?: { changes?: number; [key: string]: unknown };
  }>;
  all<T = unknown>(): Promise<{ results?: T[] }>;
};

type D1Database = {
  prepare(query: string): D1PreparedStatement;
  batch(statements: D1PreparedStatement[]): Promise<
    Array<{
      results?: unknown[];
      success?: boolean;
      meta?: { changes?: number; [key: string]: unknown };
    }>
  >;
};

type Runtime = import("@astrojs/cloudflare").Runtime<{
  DB: D1Database;
  PUBLIC_STATE_API: string;
  ACCESS_TEAM_DOMAIN: string;
  ACCESS_POLICY_AUD: string;
  ADMIN_ACTION_ENCRYPTION_KEY?: string;
  ADMIN_ACTION_ENCRYPTION_KEYS?: string;
  ADMIN_ACTION_ENCRYPTION_KEY_VERSION?: string;
}>;

declare namespace App {
  interface Locals extends Runtime {
    passkeySessionActive?: boolean;
    nativeSessionActive?: boolean;
  }
}
