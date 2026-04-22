export { defineService } from "./define";
export type {
  ServiceManifestInput,
  ServiceHandle,
  Visibility,
  MiniSpec,
  AccessSpec,
  PlannedWrite,
  ApplyOptions,
  Action,
} from "./types";
export { serviceManifestSchema } from "./schema";
export {
  renderRegistryRow,
  upsertServiceRegistry,
  markRetired,
} from "./generators/d1";
export type { ServiceRegistryRow } from "./generators/d1";
export { plistLabel, plistPath, renderPlist } from "./generators/plist";
