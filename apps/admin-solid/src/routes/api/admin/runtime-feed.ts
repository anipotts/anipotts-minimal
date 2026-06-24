import type { RuntimeOverlayResponse, RuntimeRepoOverlay } from "~/data/control-plane";

const RUNTIME_FEED_PATH = "/Users/anipotts/Infra/state/runtime/admin/admin-feed.current.json";

type RuntimeFeedFile = {
  generated_at?: string;
  machine?: string;
  runtime?: {
    repo_state_overlays?: RuntimeRepoOverlay[];
    safety?: RuntimeOverlayResponse["safety"];
  };
};

export async function GET() {
  if (!import.meta.env.DEV) {
    return Response.json(disabledResponse());
  }

  try {
    const { readFile } = await import("node:fs/promises");
    const raw = await readFile(RUNTIME_FEED_PATH, "utf8");
    const feed = JSON.parse(raw) as RuntimeFeedFile;

    return Response.json({
      available: true,
      mode: "local_dev",
      generated_at: feed.generated_at ?? null,
      machine: feed.machine ?? null,
      source_path: RUNTIME_FEED_PATH,
      safety: feed.runtime?.safety ?? null,
      overlays: feed.runtime?.repo_state_overlays ?? [],
    } satisfies RuntimeOverlayResponse);
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
    return Response.json({
      ...disabledResponse(),
      mode: code === "ENOENT" ? "missing" : "error",
      error: error instanceof Error ? error.message : "unknown runtime feed read failure",
    } satisfies RuntimeOverlayResponse);
  }
}

function disabledResponse(): RuntimeOverlayResponse {
  return {
    available: false,
    mode: "disabled",
    generated_at: null,
    machine: null,
    source_path: RUNTIME_FEED_PATH,
    safety: null,
    overlays: [],
  };
}
