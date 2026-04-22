import { writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import type {
  ServiceManifestInput,
  PlannedWrite,
  ApplyOptions,
} from "../types";
import { planPlist } from "../generators/plist";
import { planCloudflared } from "../generators/cloudflared";
import { planCfAccess } from "../generators/cf-access";
import { planD1 } from "../generators/d1";

export async function planAll(
  m: ServiceManifestInput,
): Promise<PlannedWrite[]> {
  return Promise.all([
    planPlist(m),
    planCloudflared(m),
    planCfAccess(m),
    planD1(m),
  ]);
}

export async function apply(
  m: ServiceManifestInput,
  opts: ApplyOptions = {},
): Promise<PlannedWrite[]> {
  const plans = await planAll(m);
  if (opts.dryRun) return plans;

  for (const plan of plans) {
    if (!plan.changed) continue;
    if (plan.kind === "plist" && plan.path && plan.body) {
      if (m.mini.preserveExistingPlist) continue;
      await mkdir(dirname(plan.path), { recursive: true });
      await writeFile(plan.path, plan.body, "utf8");
      continue;
    }
    // cloudflared, cf-access, d1 writes are deferred to Session 2b:
    // they require Mini SSH, CF API token, and D1 binding respectively.
    // Session 2a's apply (non-dry) only materializes local plists.
  }
  return plans;
}
