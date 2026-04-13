import { getEnv } from "@anipotts/lib/env";
import type { QCEnv } from "@anipotts/lib/quantercise";

/** Shared env builder for all QC server components and actions */
export function getQCEnv(): QCEnv {
  return {
    QUANTERCISE_ADMIN_TOKEN: getEnv("QUANTERCISE_ADMIN_TOKEN"),
    QUANTERCISE_BASE_URL: getEnv("QUANTERCISE_BASE_URL"),
  };
}
