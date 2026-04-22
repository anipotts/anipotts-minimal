import { serviceManifestSchema } from "./schema";
import type {
  ServiceManifestInput,
  ServiceHandle,
  ApplyOptions,
  PlannedWrite,
} from "./types";
import { apply } from "./actions/apply";
import { diff } from "./actions/diff";
import { retire } from "./actions/retire";
import { status } from "./actions/status";
import { runFromArgv } from "./cli";

export function defineService(input: ServiceManifestInput): ServiceHandle {
  const parsed = serviceManifestSchema.parse(input);
  const manifest: ServiceManifestInput = parsed as ServiceManifestInput;

  return {
    manifest,
    runFromArgv: (argv?: string[]) => runFromArgv(manifest, argv),
    apply: (opts?: ApplyOptions): Promise<PlannedWrite[]> =>
      apply(manifest, opts),
    diff: (): Promise<PlannedWrite[]> => diff(manifest),
    retire: () => retire(manifest),
    status: () => status(manifest),
  };
}
