import { getEnv } from "../env";
import type {
  MiniVitalsLive,
  MiniAgents,
  MiniRepos,
  MiniRudy,
  MiniSessions,
  MiniSyncthing,
  MiniPresence,
  MiniVault,
  MiniHealth,
  MiniProcesses,
} from "./types";

const TIMEOUT_MS = 5_000;

function getMiniUrl(): string {
  return getEnv("MINI_API_URL") || "https://api.mini.anipotts.com";
}

function getMiniKey(): string {
  return getEnv("MINI_API_KEY") || "";
}

async function fetchMini<T>(path: string): Promise<T | null> {
  const key = getMiniKey();
  if (!key) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${getMiniUrl()}${path}`, {
      headers: { Authorization: `Bearer ${key}` },
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    clearTimeout(timeout);
    return null;
  }
}

export async function getMiniHealth(): Promise<MiniHealth | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const res = await fetch(`${getMiniUrl()}/health`, {
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    return (await res.json()) as MiniHealth;
  } catch {
    return null;
  }
}

export async function getMiniVitalsLive(): Promise<MiniVitalsLive | null> {
  return fetchMini<MiniVitalsLive>("/ops/vitals");
}

export async function getMiniProcesses(): Promise<MiniProcesses | null> {
  return fetchMini<MiniProcesses>("/ops/processes");
}

export async function getMiniAgents(): Promise<MiniAgents | null> {
  return fetchMini<MiniAgents>("/ops/agents");
}

export async function getMiniRudy(): Promise<MiniRudy | null> {
  return fetchMini<MiniRudy>("/ops/rudy");
}

export async function getMiniSyncthing(): Promise<MiniSyncthing | null> {
  return fetchMini<MiniSyncthing>("/ops/syncthing");
}

export async function getMiniPresence(): Promise<MiniPresence | null> {
  return fetchMini<MiniPresence>("/ops/presence");
}

export async function getMiniRepos(): Promise<MiniRepos | null> {
  return fetchMini<MiniRepos>("/code/repos");
}

export async function getMiniSessions(): Promise<MiniSessions | null> {
  return fetchMini<MiniSessions>("/analytics/sessions");
}

export async function getMiniVaultStats(): Promise<MiniVault | null> {
  return fetchMini<MiniVault>("/vault/stats");
}
