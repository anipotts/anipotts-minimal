import { needsAniItemsFromJson, type NeedsAniItem } from "./needs.js";

export const RUNTIME_FEED_PATH =
  "/Users/anipotts/Infra/state/runtime/admin/admin-feed.current.json";

export type RuntimeDeployImpact =
  | "none"
  | "local_only"
  | "preview"
  | "production"
  | "unknown";

export type RuntimeOverlayMode = "local_dev" | "disabled" | "missing" | "error";

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
  deploy_impact: RuntimeDeployImpact;
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
  mode: RuntimeOverlayMode;
  generated_at: string | null;
  machine: string | null;
  source_path: string;
  safety: RuntimeSafety | null;
  overlays: RuntimeRepoOverlay[];
  needs_ani_queue: NeedsAniItem[];
  error?: string;
};

export type RuntimeFeedFile = {
  generated_at?: string;
  machine?: string;
  runtime?: {
    needs_ani_queue?: unknown;
    repo_state_overlays?: unknown;
    safety?: unknown;
  };
};

const deployImpacts = new Set<RuntimeDeployImpact>([
  "none",
  "local_only",
  "preview",
  "production",
  "unknown",
]);

export function runtimeOverlayResponseFromFeed(
  feed: unknown,
  sourcePath = RUNTIME_FEED_PATH,
): RuntimeOverlayResponse {
  const file = isRecord(feed) ? (feed as RuntimeFeedFile) : {};
  const runtime = isRecord(file.runtime) ? file.runtime : {};

  return {
    available: true,
    mode: "local_dev",
    generated_at: isString(file.generated_at) ? file.generated_at : null,
    machine: isString(file.machine) ? file.machine : null,
    source_path: sourcePath,
    safety: runtimeSafetyFromJson(runtime.safety),
    overlays: runtimeRepoOverlaysFromJson(runtime.repo_state_overlays),
    needs_ani_queue: needsAniItemsFromJson(runtime.needs_ani_queue),
  };
}

export function disabledRuntimeOverlayResponse(
  sourcePath = RUNTIME_FEED_PATH,
): RuntimeOverlayResponse {
  return {
    available: false,
    mode: "disabled",
    generated_at: null,
    machine: null,
    source_path: sourcePath,
    safety: null,
    overlays: [],
    needs_ani_queue: [],
  };
}

export function runtimeOverlayErrorResponse(
  error: unknown,
  sourcePath = RUNTIME_FEED_PATH,
): RuntimeOverlayResponse {
  const code = isRecord(error) && "code" in error ? String(error.code) : "";

  return {
    ...disabledRuntimeOverlayResponse(sourcePath),
    mode: code === "ENOENT" ? "missing" : "error",
    error:
      error instanceof Error
        ? error.message
        : "unknown runtime feed read failure",
  };
}

export function runtimeRepoOverlaysFromJson(
  value: unknown,
): RuntimeRepoOverlay[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const overlay = runtimeRepoOverlayFromJson(item);
    return overlay ? [overlay] : [];
  });
}

function runtimeRepoOverlayFromJson(value: unknown): RuntimeRepoOverlay | null {
  if (!isRecord(value)) return null;

  if (
    !isString(value.repo_state_id) ||
    !isString(value.repo) ||
    !isString(value.repo_root_label) ||
    !isString(value.machine) ||
    typeof value.git_available !== "boolean" ||
    !isString(value.live_runtime_role) ||
    !isString(value.notes)
  ) {
    return null;
  }

  return {
    repo_state_id: value.repo_state_id,
    repo: value.repo,
    repo_root_label: value.repo_root_label,
    machine: value.machine,
    git_available: value.git_available,
    branch: stringOrNull(value.branch),
    head_sha: stringOrNull(value.head_sha),
    upstream: stringOrNull(value.upstream),
    upstream_sha: stringOrNull(value.upstream_sha),
    ahead: numberOrNull(value.ahead),
    behind: numberOrNull(value.behind),
    dirty_tracked_count: numberOrNull(value.dirty_tracked_count),
    untracked_count: numberOrNull(value.untracked_count),
    deploy_impact: deployImpactFromJson(value.deploy_impact),
    live_runtime_role: value.live_runtime_role,
    notes: value.notes,
  };
}

function runtimeSafetyFromJson(value: unknown): RuntimeSafety | null {
  if (!isRecord(value)) return null;

  if (
    typeof value.dirty_filenames_included !== "boolean" ||
    typeof value.file_contents_included !== "boolean" ||
    typeof value.health_payloads_included !== "boolean" ||
    typeof value.secret_values_included !== "boolean" ||
    !isString(value.mode)
  ) {
    return null;
  }

  return {
    dirty_filenames_included: value.dirty_filenames_included,
    file_contents_included: value.file_contents_included,
    health_payloads_included: value.health_payloads_included,
    mode: value.mode,
    secret_values_included: value.secret_values_included,
  };
}

function deployImpactFromJson(value: unknown): RuntimeDeployImpact {
  return isString(value) && deployImpacts.has(value as RuntimeDeployImpact)
    ? (value as RuntimeDeployImpact)
    : "unknown";
}

function stringOrNull(value: unknown): string | null {
  return isString(value) ? value : null;
}

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}
