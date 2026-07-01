import manifestJson from "./static/carousels/durable_agent_workflows_v2.json";

const MEDIA_BASE = "/media/carousels/durable_agent_workflows/v2/";

type FileRef = {
  rel?: string;
  exists?: boolean;
  bytes?: number;
  mtime?: string;
  width?: number;
  height?: number;
};

type Freshness = {
  status?: string;
  stale?: boolean;
  override_updated_at?: string;
  platform_output_mtime?: string;
  master_output_mtime?: string;
};

type Platform = {
  label?: string;
  outputs?: {
    platform?: FileRef;
    master?: FileRef;
  };
  freshness?: Freshness;
  base_preview_endpoint?: string;
};

type Slide = {
  n: number;
  goal?: string;
  text?: string;
  visual_id?: string;
  source_asset?: {
    visual_id?: string;
    status?: string;
    still?: FileRef;
    raw_kind?: string;
    source_size?: string;
    still_size?: string;
  };
  platforms?: {
    ig?: Platform;
    tt?: Platform;
  };
};

type CarouselPost = {
  id: string;
  index: number;
  title: string;
  status: string;
  caption?: string;
  hashtags?: string[];
  sound?: {
    status?: string;
  };
  contacts?: {
    ig?: FileRef;
    tt?: FileRef;
  };
  approval?: {
    phone_mock_instagram?: FileRef;
    phone_mock_tiktok?: FileRef;
  };
  slides: Slide[];
};

type CarouselManifest = {
  series: {
    id: string;
    status: string;
    root?: string;
    plan_generated_at?: string;
    crop_targets?: {
      ig?: { w: number; h: number };
      tt?: { w: number; h: number };
    };
  };
  counts: {
    posts: number;
    slides: number;
    visuals_in_plan?: number;
    highres_assets_ready?: number;
    selected_assets?: number;
  };
  boundaries?: Record<string, string>;
  local_editor_url?: string;
  posts: CarouselPost[];
};

const manifest = manifestJson as CarouselManifest;

function assetUrl(file?: FileRef): string | null {
  if (!file?.rel || file.exists === false) return null;
  return `${MEDIA_BASE}${file.rel}`;
}

function platformSummary(platform?: Platform) {
  return {
    label: platform?.label ?? "unknown platform",
    image: assetUrl(platform?.outputs?.platform),
    masterRel: platform?.outputs?.master?.rel ?? "not copied",
    outputRel: platform?.outputs?.platform?.rel ?? "missing",
    size:
      platform?.outputs?.platform?.width && platform.outputs.platform.height
        ? `${platform.outputs.platform.width}x${platform.outputs.platform.height}`
        : "unknown",
    bytes: platform?.outputs?.platform?.bytes ?? 0,
    freshness: platform?.freshness?.status ?? "unknown",
    stale: platform?.freshness?.stale === true,
    renderedAt: platform?.freshness?.platform_output_mtime ?? "unknown",
    previewEndpoint: platform?.base_preview_endpoint ?? "",
  };
}

export const carouselSeries = {
  id: manifest.series.id,
  status: manifest.series.status,
  generatedAt: manifest.series.plan_generated_at ?? "unknown",
  sourceRoot: manifest.series.root ?? "media carousel handoff",
  localEditorUrl: manifest.local_editor_url ?? "",
  cropTargets: {
    instagram: manifest.series.crop_targets?.ig
      ? `${manifest.series.crop_targets.ig.w}x${manifest.series.crop_targets.ig.h}`
      : "1080x1350",
    tiktok: manifest.series.crop_targets?.tt
      ? `${manifest.series.crop_targets.tt.w}x${manifest.series.crop_targets.tt.h}`
      : "1080x1920",
  },
  boundaries: manifest.boundaries ?? {},
};

export const carouselPosts = manifest.posts.map((post) => {
  const slides = post.slides.map((slide) => ({
    number: slide.n,
    goal: slide.goal ?? "review slide",
    text: slide.text ?? "",
    visualId: slide.visual_id ?? slide.source_asset?.visual_id ?? "unknown",
    sourceStatus: slide.source_asset?.status ?? "unknown",
    sourceSize:
      slide.source_asset?.still_size ??
      slide.source_asset?.source_size ??
      "unknown",
    instagram: platformSummary(slide.platforms?.ig),
    tiktok: platformSummary(slide.platforms?.tt),
  }));

  const staleCount = slides.reduce(
    (count, slide) =>
      count + Number(slide.instagram.stale) + Number(slide.tiktok.stale),
    0,
  );

  return {
    id: post.id,
    index: post.index,
    title: post.title,
    status: post.status,
    caption: post.caption ?? "",
    hashtags: post.hashtags ?? [],
    soundStatus: post.sound?.status ?? "unknown",
    phoneMockInstagram: assetUrl(post.approval?.phone_mock_instagram),
    phoneMockTiktok: assetUrl(post.approval?.phone_mock_tiktok),
    contactInstagram: assetUrl(post.contacts?.ig),
    contactTiktok: assetUrl(post.contacts?.tt),
    slides,
    slideCount: slides.length,
    staleCount,
    readyExports: slides.length * 2 - staleCount,
  };
});

export const carouselSummary = {
  posts: manifest.counts.posts,
  slides: manifest.counts.slides,
  platformExports: manifest.counts.slides * 2,
  staleExports: carouselPosts.reduce(
    (count, post) => count + post.staleCount,
    0,
  ),
  soundApprovalsNeeded: carouselPosts.filter(
    (post) => post.soundStatus !== "approved",
  ).length,
  highresAssetsReady: manifest.counts.highres_assets_ready ?? 0,
  selectedAssets: manifest.counts.selected_assets ?? 0,
};
