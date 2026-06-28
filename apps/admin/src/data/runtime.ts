import type { NeedsAniItem } from "./needs";

export const RUNTIME_FEED_PATH =
  "/Users/anipotts/Infra/state/runtime/admin/admin-feed.current.json";

export type RuntimeRepoOverlay = {
  repo_state_id: string;
  repo: string;
  repo_root_label: string;
  machine: string;
  git_available: boolean;
  branch: string | null;
  head_sha: string | null;
  upstream: string | null;
  upstream_sha: string | null;
  ahead: number | null;
  behind: number | null;
  dirty_tracked_count: number | null;
  untracked_count: number | null;
  deploy_impact: "none" | "local_only" | "preview" | "production" | "unknown";
  live_runtime_role: string;
  notes: string;
};

export type RuntimeSafety = {
  dirty_filenames_included: boolean;
  file_contents_included: boolean;
  health_payloads_included: boolean;
  mode: string;
  secret_values_included: boolean;
};

export type RuntimeOverlayResponse = {
  available: boolean;
  mode: "local_dev" | "disabled" | "missing" | "error";
  generated_at: string | null;
  machine: string | null;
  source_path: string;
  safety: RuntimeSafety | null;
  overlays: RuntimeRepoOverlay[];
  needs_ani_queue: NeedsAniItem[];
  error?: string;
};

type RuntimeFeedFile = {
  generated_at?: string;
  machine?: string;
  runtime?: {
    needs_ani_queue?: NeedsAniItem[];
    repo_state_overlays?: RuntimeRepoOverlay[];
    safety?: RuntimeSafety;
  };
};

export async function loadRuntimeOverlayResponse(): Promise<RuntimeOverlayResponse> {
  if (!import.meta.env.DEV) {
    return disabledResponse();
  }

  try {
    const nodeFsModule = "node:fs/promises";
    const { readFile } = (await import(
      /* @vite-ignore */ nodeFsModule
    )) as typeof import("node:fs/promises");
    const raw = await readFile(RUNTIME_FEED_PATH, "utf8");
    const feed = JSON.parse(raw) as RuntimeFeedFile;

    return {
      available: true,
      mode: "local_dev",
      generated_at: feed.generated_at ?? null,
      machine: feed.machine ?? null,
      source_path: RUNTIME_FEED_PATH,
      safety: feed.runtime?.safety ?? null,
      overlays: feed.runtime?.repo_state_overlays ?? [],
      needs_ani_queue: feed.runtime?.needs_ani_queue ?? [],
    };
  } catch (error) {
    const code =
      typeof error === "object" && error && "code" in error
        ? String(error.code)
        : "";

    return {
      ...disabledResponse(),
      mode: code === "ENOENT" ? "missing" : "error",
      error:
        error instanceof Error
          ? error.message
          : "unknown runtime feed read failure",
    };
  }
}

export function disabledResponse(): RuntimeOverlayResponse {
  return {
    available: false,
    mode: "disabled",
    generated_at: null,
    machine: null,
    source_path: RUNTIME_FEED_PATH,
    safety: null,
    overlays: [],
    needs_ani_queue: [],
  };
}
