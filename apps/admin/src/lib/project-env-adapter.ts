import type { QCEnv } from "@anipotts/lib/quantercise";

import { getProjectEnv } from "./projects";

/** Maps generic ProjectEnv to the QC client's expected field names */
export function getQCEnvForProject(slug: string): QCEnv {
  const env = getProjectEnv(slug);
  return {
    QUANTERCISE_ADMIN_TOKEN: env.ADMIN_TOKEN,
    QUANTERCISE_BASE_URL: env.BASE_URL,
  };
}
