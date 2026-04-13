import { getEnv } from "@anipotts/lib/env";

export interface ProjectEnv {
  BASE_URL?: string;
  ADMIN_TOKEN?: string;
}

export type ProjectCapability =
  | "marketing"
  | "feedback"
  | "dashboard"
  | "users"
  | "analytics"
  | "payments"
  | "health";

export interface ProjectConfig {
  slug: string;
  name: string;
  baseUrlEnvKey: string;
  tokenEnvKey: string;
  defaultBaseUrl: string;
  capabilities: ProjectCapability[];
}

export const PROJECTS: ProjectConfig[] = [
  {
    slug: "quantercise",
    name: "Quantercise",
    baseUrlEnvKey: "QUANTERCISE_BASE_URL",
    tokenEnvKey: "QUANTERCISE_ADMIN_TOKEN",
    defaultBaseUrl: "https://quantercise.com",
    capabilities: [
      "marketing",
      "feedback",
      "dashboard",
      "users",
      "analytics",
      "payments",
      "health",
    ],
  },
];

export function getProject(slug: string): ProjectConfig | undefined {
  return PROJECTS.find((p) => p.slug === slug);
}

export function getProjectsWithCapability(
  cap: ProjectCapability,
): ProjectConfig[] {
  return PROJECTS.filter((p) => p.capabilities.includes(cap));
}

export function getProjectEnv(slug: string): ProjectEnv {
  const project = getProject(slug);
  if (!project) throw new Error(`Unknown project: ${slug}`);
  return {
    BASE_URL: getEnv(project.baseUrlEnvKey) || project.defaultBaseUrl,
    ADMIN_TOKEN: getEnv(project.tokenEnvKey),
  };
}
