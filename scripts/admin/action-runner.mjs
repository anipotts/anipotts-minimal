#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";

const actionId = valueAfter("--action");
const execute = process.argv.includes("--execute");
const baseUrl = process.env.ADMIN_BASE_URL;
const claimToken = process.env.ADMIN_ACTION_CLAIM_TOKEN;
const proofToken = process.env.ADMIN_ACTION_PROOF_TOKEN;
if (!actionId) throw new Error("--action is required");
if (!execute) {
  process.stdout.write(
    JSON.stringify({
      ok: true,
      mode: "dry-run",
      action_id: actionId,
      claimed: false,
    }) + "\n",
  );
  process.exit(0);
}
if (!baseUrl || !claimToken || !proofToken)
  throw new Error(
    "ADMIN_BASE_URL, ADMIN_ACTION_CLAIM_TOKEN, and ADMIN_ACTION_PROOF_TOKEN are required",
  );

const claim = await api(
  `/api/admin/actions/${encodeURIComponent(actionId)}/claim`,
  {},
  claimToken,
);
let proof;
try {
  proof = runAdapter(claim.action_type, claim.payload);
  await api(
    `/api/admin/actions/${encodeURIComponent(actionId)}/proof`,
    {
      succeeded: true,
      proof,
    },
    proofToken,
  );
} catch (error) {
  await api(
    `/api/admin/actions/${encodeURIComponent(actionId)}/proof`,
    {
      succeeded: false,
      error_code: "provider_command_failed",
      proof: {
        provider: providerFor(claim.action_type),
        summary: "provider command failed",
        observed_at: new Date().toISOString(),
      },
    },
    proofToken,
  );
  throw error;
}
process.stdout.write(
  JSON.stringify({
    ok: true,
    action_id: actionId,
    status: "succeeded",
    receipt_ref: proof.receipt_ref,
  }) + "\n",
);

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
  return {
    provider: providerFor(type),
    receipt_ref: createHash("sha256")
      .update(String(parsed.id ?? parsed.updatedRange ?? "provider-accepted"))
      .digest("base64url"),
    observed_at: new Date().toISOString(),
    summary: "provider accepted the confirmed action",
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
