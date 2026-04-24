/**
 * One-time backfill: Content/logs/brands.yaml → D1 brands_emails via ingest worker.
 *
 * Usage:
 *   export BRANDS_INGEST_KEY=<secret>       # required; set with `wrangler secret put BRANDS_INGEST_KEY`
 *   export INGEST_URL=<url>                 # optional; defaults to prod ingest worker
 *   pnpm tsx scripts/backfill-brands-emails.ts [--dry-run] [--yaml <path>]
 *
 * Idempotency: synthetic message_ids are deterministic (sha256 of date|from|subject),
 * so the ingest worker's merge-upsert makes re-runs safe. A second invocation inserts 0.
 *
 * This parses a narrow, known YAML format (list of `-` items with date/from/subject/label).
 * No `yaml` package dependency by design — one-off script, keep it self-contained.
 */

import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { homedir } from "node:os";
import { join } from "node:path";

interface YamlEntry {
  date: string;
  from: string;
  subject: string;
  label: string;
}

interface D1Row {
  message_id: string;
  thread_id: string;
  received_at: string;
  from_addr: string;
  subject: string;
  label: string;
}

const DEFAULT_YAML = join(homedir(), "Content", "logs", "brands.yaml");
const DEFAULT_INGEST_URL = "https://anipotts-ingest.anipotts.workers.dev";
const BATCH_SIZE = 50;

function parseArgs(argv: string[]): { dryRun: boolean; yamlPath: string } {
  const dryRun = argv.includes("--dry-run");
  const yamlIdx = argv.indexOf("--yaml");
  const yamlPath =
    yamlIdx !== -1 && argv[yamlIdx + 1] ? argv[yamlIdx + 1] : DEFAULT_YAML;
  return { dryRun, yamlPath };
}

/**
 * Narrow-purpose parser for brands.yaml.
 * Format: repeating blocks of `- date: "..."` followed by `  from:`, `  subject:`, `  label:`.
 * Each value is a double-quoted string. Returns every complete block.
 */
function parseBrandsYaml(raw: string): YamlEntry[] {
  const lines = raw.split("\n");
  const entries: YamlEntry[] = [];
  let current: Partial<YamlEntry> | null = null;

  const flush = () => {
    if (
      current &&
      current.date &&
      current.from &&
      current.subject &&
      current.label
    ) {
      entries.push(current as YamlEntry);
    }
    current = null;
  };

  for (const line of lines) {
    if (line.startsWith("#") || line.trim() === "") continue;

    // Start of a new block
    const dateMatch = line.match(/^- date:\s*"(.*)"\s*$/);
    if (dateMatch) {
      flush();
      current = { date: dateMatch[1] };
      continue;
    }

    if (!current) continue;

    const fromMatch = line.match(/^\s+from:\s*"(.*)"\s*$/);
    if (fromMatch) {
      current.from = fromMatch[1];
      continue;
    }

    const subjectMatch = line.match(/^\s+subject:\s*"(.*)"\s*$/);
    if (subjectMatch) {
      current.subject = subjectMatch[1];
      continue;
    }

    const labelMatch = line.match(/^\s+label:\s*"(.*)"\s*$/);
    if (labelMatch) {
      current.label = labelMatch[1];
      continue;
    }
  }

  flush();
  return entries;
}

function syntheticId(entry: YamlEntry): string {
  const basis = `${entry.date}|${entry.from}|${entry.subject}`;
  const hash = createHash("sha256").update(basis).digest("hex").slice(0, 16);
  return `bf:${hash}`;
}

async function postBatch(
  url: string,
  key: string,
  rows: D1Row[],
): Promise<{ success: boolean; rows_written: number }> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Ingest-Key": key,
    },
    body: JSON.stringify({ category: "brands_email", data: rows }),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Ingest ${res.status}: ${text}`);
  }
  return JSON.parse(text) as { success: boolean; rows_written: number };
}

async function main() {
  const { dryRun, yamlPath } = parseArgs(process.argv.slice(2));
  const ingestUrl = process.env.INGEST_URL ?? DEFAULT_INGEST_URL;
  const ingestKey = process.env.BRANDS_INGEST_KEY;

  if (!dryRun && !ingestKey) {
    console.error(
      "BRANDS_INGEST_KEY env var required (set via `wrangler secret put BRANDS_INGEST_KEY`).\n" +
        "Use --dry-run to preview without posting.",
    );
    process.exit(1);
  }

  console.log(`Reading ${yamlPath}`);
  const raw = readFileSync(yamlPath, "utf8");
  const entries = parseBrandsYaml(raw);
  console.log(`Parsed ${entries.length} entries`);

  const rows: D1Row[] = entries.map((e) => {
    const id = syntheticId(e);
    return {
      message_id: id,
      thread_id: id, // no thread_id in YAML; reuse synthetic to satisfy NOT NULL
      received_at: new Date(e.date).toISOString(),
      from_addr: e.from,
      subject: e.subject,
      label: e.label,
    };
  });

  if (dryRun) {
    console.log("DRY RUN — first 3 rows:");
    console.log(JSON.stringify(rows.slice(0, 3), null, 2));
    console.log(
      `Would POST ${rows.length} rows to ${ingestUrl} in batches of ${BATCH_SIZE}`,
    );
    return;
  }

  let totalWritten = 0;
  const batchCount = Math.ceil(rows.length / BATCH_SIZE);
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { rows_written } = await postBatch(ingestUrl, ingestKey!, batch);
    totalWritten += rows_written;
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    console.log(
      `Batch ${batchNum}/${batchCount}: ${rows_written}/${batch.length} written (cumulative ${totalWritten})`,
    );
  }

  console.log(
    `Done. ${totalWritten}/${rows.length} rows ingested. Re-run is safe (idempotent on message_id).`,
  );
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
