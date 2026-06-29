import {
  disabledRuntimeOverlayResponse,
  RUNTIME_FEED_PATH,
  runtimeOverlayErrorResponse,
  runtimeOverlayResponseFromFeed,
  type RuntimeOverlayResponse,
} from "@anipotts/content/admin";

export {
  RUNTIME_FEED_PATH,
  type RuntimeOverlayResponse,
  type RuntimeRepoOverlay,
  type RuntimeSafety,
} from "@anipotts/content/admin";

export async function loadRuntimeOverlayResponse(): Promise<RuntimeOverlayResponse> {
  if (!import.meta.env.DEV) {
    return disabledRuntimeOverlayResponse();
  }

  try {
    const nodeFsModule = "node:fs/promises";
    const { readFile } = (await import(
      /* @vite-ignore */ nodeFsModule
    )) as typeof import("node:fs/promises");
    const raw = await readFile(RUNTIME_FEED_PATH, "utf8");
    return runtimeOverlayResponseFromFeed(JSON.parse(raw));
  } catch (error) {
    return runtimeOverlayErrorResponse(error);
  }
}
