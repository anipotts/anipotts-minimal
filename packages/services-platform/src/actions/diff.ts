import type { ServiceManifestInput, PlannedWrite } from "../types";
import { planAll } from "./apply";

export async function diff(m: ServiceManifestInput): Promise<PlannedWrite[]> {
  return planAll(m);
}
