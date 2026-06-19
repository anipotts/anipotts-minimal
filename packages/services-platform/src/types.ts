// Public types for service manifests. Runtime Zod schema lives in schema.ts.

export type Visibility = "internal" | "public";

export interface MiniSpec {
  port: number;
  workingDir: string;
  command: string[];
  healthPath?: string;
  env?: Record<string, string>;
  // If true, generators skip overwriting an already-provisioned plist when
  // contents differ. Used to migrate hand-authored services safely.
  preserveExistingPlist?: boolean;
}

export interface AccessSpec {
  emails?: string[];
  serviceTokenIds?: string[];
}

export interface ServiceManifestInput {
  name: string;
  hostname: string;
  visibility: Visibility;
  mini: MiniSpec;
  access?: AccessSpec;
  owner: string;
  description?: string;
}

export type Action = "apply" | "diff";

export interface ApplyOptions {
  dryRun?: boolean;
}

export interface PlannedWrite {
  kind: "plist" | "cloudflared" | "cf-access" | "d1";
  path?: string;
  changed: boolean;
  summary: string;
  // Optional full contents for plist/yaml/json. For review, not always printed.
  body?: string;
}

export interface ServiceHandle {
  manifest: ServiceManifestInput;
  runFromArgv(argv?: string[]): Promise<void>;
  apply(opts?: ApplyOptions): Promise<PlannedWrite[]>;
  diff(): Promise<PlannedWrite[]>;
}
