#!/usr/bin/env bun

import { homedir } from "node:os";
import { join } from "node:path";
import { provisionDeviceIdentity } from "./device-identity";
import { LocalJournal } from "./journal";
import { ControlPlaneRunner } from "./runner";

const stateRoot =
  process.env.CONTROL_PLANE_STATE_ROOT ??
  join(homedir(), "Library", "Application Support", "anipotts-control-plane");
const privateKeyPath = join(stateRoot, "device-private.jwk");
const journalPath = join(stateRoot, "journal.sqlite");
const relayUrl =
  process.env.CONTROL_PLANE_RELAY_URL ??
  "wss://api.anipotts.com/api/control/devices/ap-mini/connect";

const command = process.argv[2] ?? "run";

if (command === "provision") {
  const identity = await provisionDeviceIdentity(privateKeyPath);
  console.log(JSON.stringify(identity.publicJwk));
} else if (command === "verify-journal") {
  const journal = new LocalJournal(journalPath);
  console.log(JSON.stringify(journal.verifyChain()));
  journal.close();
} else if (command === "run" || command === "once") {
  const runner = new ControlPlaneRunner({
    relayUrl,
    journalPath,
    privateKeyPath,
    once: command === "once",
  });
  try {
    await runner.run();
  } finally {
    runner.close();
  }
} else {
  console.error(
    "usage: anipotts-control-plane [provision|run|once|verify-journal]",
  );
  process.exitCode = 2;
}
