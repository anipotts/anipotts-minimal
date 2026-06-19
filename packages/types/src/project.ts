export type ProjectCategory = "ai" | "product" | "quant" | "music" | "other";
export type ProjectStatus = "live" | "in-progress" | "coming-soon" | "archived";
export type WorkPublishState =
  | "publish_now"
  | "placeholder"
  | "improve_then_publish"
  | "archive";

export interface DemoAsset {
  webm?: string;
  gif?: string;
  poster?: string;
  durationMs?: number;
  sizeBytes?: number;
}

export interface Project {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  year: string;
  category: ProjectCategory;
  role: string;
  duration: string;
  tags: string[];
  status?: ProjectStatus;
  featured?: boolean;
  visible?: boolean;
  icon?: "chrome";
  priority?: number;
  publishState?: WorkPublishState;
  summary?: string;
  demo?: DemoAsset;
  links?: {
    live?: string;
    repo?: string;
    page?: string;
  };
}
