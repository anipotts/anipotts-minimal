#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  chmod,
  mkdir,
  readFile,
  rename,
  unlink,
  writeFile,
} from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { runAdminAction } from "./action-runner-lib.mjs";

const actionId = valueAfter("--action");
const execute = process.argv.includes("--execute");
const baseUrl = process.env.ADMIN_BASE_URL;
const claimToken = process.env.ADMIN_ACTION_CLAIM_TOKEN;
const proofToken = process.env.ADMIN_ACTION_PROOF_TOKEN;
if (!actionId) throw new Error("--action is required");
if (!execute) {
  process.stdout.write(
    `${JSON.stringify({ ok: true, mode: "dry-run", action_id: actionId, claimed: false })}\n`,
  );
  process.exit(0);
}
if (!baseUrl || !claimToken || !proofToken) {
  throw new Error("admin action runner configuration is incomplete");
}

const result = await runAdminAction({
  actionId,
  claim: (body) =>
    api(
      `/api/admin/actions/${encodeURIComponent(actionId)}/claim`,
      body,
      claimToken,
    ),
  prove: (body) =>
    api(
      `/api/admin/actions/${encodeURIComponent(actionId)}/proof`,
      body,
      proofToken,
    ),
  adapter: runAdapter,
  journal: fileJournal(actionId),
});
process.stdout.write(`${JSON.stringify(result)}\n`);

async function api(pathname, body, token) {
  const response = await fetch(new URL(pathname, baseUrl), {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok)
    throw new Error(`admin action API rejected with ${response.status}`);
  return response.json();
}

function runAdapter(type, payload) {
  const common = {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 4 * 1024 * 1024,
  };
  let output;
  if (type === "career.gmail.send" || type === "career.gmail.reply") {
    output = execFileSync(
      "gog",
      [
        "gmail",
        "send",
        "--account",
        payload.account,
        "--to",
        payload.recipient,
        "--subject",
        payload.subject,
        "--body",
        payload.content,
        "--json",
      ],
      common,
    );
  } else if (type === "career.calendar.create") {
    output = execFileSync(
      "gog",
      [
        "calendar",
        "create",
        payload.calendar_id,
        "--account",
        payload.account,
        "--summary",
        payload.summary,
        "--start",
        payload.start,
        "--end",
        payload.end,
        "--json",
      ],
      common,
    );
  } else if (type === "career.calendar.update") {
    output = execFileSync(
      "gog",
      [
        "calendar",
        "update",
        payload.calendar_id,
        payload.event_id,
        "--account",
        payload.account,
        "--summary",
        payload.summary,
        "--start",
        payload.start,
        "--end",
        payload.end,
        "--json",
      ],
      common,
    );
  } else if (type === "career.tracker.update") {
    output = execFileSync(
      "gog",
      [
        "sheets",
        "update",
        payload.spreadsheet_id,
        payload.range,
        "--values-json",
        JSON.stringify(payload.values),
        "--json",
      ],
      common,
    );
  } else {
    throw new Error("proposal-only action cannot execute");
  }
  const parsed = JSON.parse(output);
  const providerReceipt = parsed.id ?? parsed.updatedRange;
  if (typeof providerReceipt !== "string" || !providerReceipt) {
    throw new Error("provider response omitted its receipt");
  }
  return {
    provider: providerFor(type),
    receipt_digest: createHash("sha256")
      .update(providerReceipt)
      .digest("base64url"),
    observed_at: new Date().toISOString(),
    summary: "provider accepted the confirmed action",
    provider_state: "accepted",
  };
}

function fileJournal(actionId) {
  const path = join(
    homedir(),
    ".local",
    "state",
    "anipotts",
    "admin-action-runner",
    `${actionId}.json`,
  );
  return {
    async load() {
      return JSON.parse(await readFile(path, "utf8").catch(() => "null"));
    },
    async save(entry) {
      await mkdir(dirname(path), { recursive: true, mode: 0o700 });
      await chmod(dirname(path), 0o700);
      const temporary = `${path}.tmp`;
      await writeFile(temporary, JSON.stringify(entry), { mode: 0o600 });
      await rename(temporary, path);
      await chmod(path, 0o600);
    },
    async remove() {
      await unlink(path).catch(() => undefined);
    },
  };
}

function providerFor(type) {
  return type.includes("gmail")
    ? "gmail"
    : type.includes("calendar")
      ? "calendar"
      : "tracker";
}
function valueAfter(flag) {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
}
