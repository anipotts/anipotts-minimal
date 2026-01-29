export type ProjectCategory = "ai" | "product" | "quant" | "music" | "other";
export type ProjectStatus = "live" | "in-progress" | "coming-soon";

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
  icon?: "chrome";
  links?: {
    live?: string;
    repo?: string;
    page?: string;
  };
}
