export type CarouselCrop = {
  platform: "instagram" | "tiktok";
  surface: string;
  aspect: "4:5" | "9:16" | "1:1";
  size: string;
  exportName: string;
  state: "expected" | "ready" | "blocked";
};

export type CarouselSlide = {
  number: number;
  title: string;
  role: string;
  slideFile: string;
  captionFile: string;
  state: "expected" | "ready" | "blocked";
};

export type CarouselSet = {
  id: string;
  title: string;
  status: "media source pending" | "review ready" | "blocked";
  sourceRoot: string;
  sourceThread: string;
  audience: string;
  concept: string;
  nextSafeAction: string;
  crops: CarouselCrop[];
  slides: CarouselSlide[];
  exportFiles: string[];
  blockedActions: string[];
};

export const carouselBoundary = {
  mode: "static admin manifest",
  runtime: "admin route does not read local media files at runtime",
  source:
    "/Users/anipotts/Media/projects/carousel-backdrops/series/durable_agent_workflows/v2",
  sourceStatus: "not bundled with admin runtime yet",
  allowed:
    "inspect sets, crop targets, slide/caption refs, and export readiness",
  blocked:
    "no social posting, scheduling, platform mutation, media deletion, or publish write",
};

export const carouselSets: CarouselSet[] = [
  {
    id: "durable-agent-workflows-v2",
    title: "durable agent workflows v2",
    status: "media source pending",
    sourceRoot: carouselBoundary.source,
    sourceThread: "media/carousels",
    audience: "anipottsbuilds",
    concept:
      "operator-facing carousel about durable agent workflows and proof-backed control planes.",
    nextSafeAction:
      "sync a media manifest or thumbnail bundle from the media thread, then bind real preview assets to this route.",
    crops: [
      {
        platform: "instagram",
        surface: "feed carousel",
        aspect: "4:5",
        size: "1080x1350",
        exportName: "ig-feed/*.png",
        state: "expected",
      },
      {
        platform: "instagram",
        surface: "reel/story",
        aspect: "9:16",
        size: "1080x1920",
        exportName: "ig-vertical/*.png",
        state: "expected",
      },
      {
        platform: "tiktok",
        surface: "vertical post",
        aspect: "9:16",
        size: "1080x1920",
        exportName: "tiktok/*.png",
        state: "expected",
      },
      {
        platform: "instagram",
        surface: "profile-safe square",
        aspect: "1:1",
        size: "1080x1080",
        exportName: "square/*.png",
        state: "expected",
      },
    ],
    slides: [
      {
        number: 1,
        title: "control plane",
        role: "open with the system promise and visual identity",
        slideFile: "slides/01-control-plane.md",
        captionFile: "captions/01-control-plane.md",
        state: "expected",
      },
      {
        number: 2,
        title: "intent",
        role: "show the owner request before any operation starts",
        slideFile: "slides/02-intent.md",
        captionFile: "captions/02-intent.md",
        state: "expected",
      },
      {
        number: 3,
        title: "authority",
        role: "make gates and allowed actions visible",
        slideFile: "slides/03-authority.md",
        captionFile: "captions/03-authority.md",
        state: "expected",
      },
      {
        number: 4,
        title: "operation",
        role: "show the work unit and owner thread",
        slideFile: "slides/04-operation.md",
        captionFile: "captions/04-operation.md",
        state: "expected",
      },
      {
        number: 5,
        title: "proof",
        role: "capture route, deploy, and artifact evidence",
        slideFile: "slides/05-proof.md",
        captionFile: "captions/05-proof.md",
        state: "expected",
      },
      {
        number: 6,
        title: "state",
        role: "close with what changed and what remains blocked",
        slideFile: "slides/06-state.md",
        captionFile: "captions/06-state.md",
        state: "expected",
      },
    ],
    exportFiles: [
      "manifest.json",
      "captions/post-caption.md",
      "captions/alt-text.md",
      "exports/ig-feed",
      "exports/ig-vertical",
      "exports/tiktok",
    ],
    blockedActions: [
      "publish to instagram",
      "publish to tiktok",
      "schedule social post",
      "mutate media source files",
      "delete source exports",
    ],
  },
];

export const carouselSummary = {
  sets: carouselSets.length,
  crops: carouselSets.reduce((sum, set) => sum + set.crops.length, 0),
  slides: carouselSets.reduce((sum, set) => sum + set.slides.length, 0),
  blockedActions: Array.from(
    new Set(carouselSets.flatMap((set) => set.blockedActions)),
  ),
};
