import type { ServiceManifestInput, PlannedWrite, Action } from "./types";
import { apply } from "./actions/apply";
import { diff } from "./actions/diff";

const ACTIONS: Action[] = ["apply", "diff"];

function formatPlans(plans: PlannedWrite[]): string {
  return plans
    .map((p) => {
      const mark = p.changed ? "*" : " ";
      return `  [${mark}] ${p.kind.padEnd(12)} ${p.summary}`;
    })
    .join("\n");
}

export async function runFromArgv(
  m: ServiceManifestInput,
  argv: string[] = process.argv.slice(2),
): Promise<void> {
  const [raw, ...rest] = argv;
  const action = (raw as Action) ?? "diff";
  if (!ACTIONS.includes(action)) {
    console.error(
      `unknown action: ${action}. expected one of ${ACTIONS.join(", ")}`,
    );
    process.exitCode = 2;
    return;
  }
  const dryRun = rest.includes("--dry-run");

  console.log(
    `service: ${m.name}  hostname: ${m.hostname}  visibility: ${m.visibility}`,
  );
  console.log(`action: ${action}${dryRun ? " (dry-run)" : ""}`);

  if (action === "diff") {
    const plans = await diff(m);
    console.log(formatPlans(plans));
    return;
  }
  if (action === "apply") {
    const plans = await apply(m, { dryRun });
    console.log(formatPlans(plans));
    if (!dryRun)
      console.log(
        "applied: local plist only. cloudflared/cf-access/d1 deferred to 2b.",
      );
    return;
  }
}
