import { afterEach, describe, expect, it } from "bun:test";
import { mkdtempSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  handshakeMessage,
  provisionDeviceIdentity,
  signHandshake,
} from "../src/device-identity";

let directory: string | null = null;

afterEach(() => {
  if (directory) rmSync(directory, { recursive: true, force: true });
  directory = null;
});

describe("device identity", () => {
  it("keeps the private key local and produces a verifiable handshake", async () => {
    directory = mkdtempSync(join(tmpdir(), "control-identity-"));
    const keyPath = join(directory, "device-private.jwk");
    const identity = await provisionDeviceIdentity(keyPath);
    const handshake = await signHandshake(
      identity,
      new Date("2026-07-31T12:00:00.000Z"),
      "abcdefghijklmnopqrstuv",
    );
    const key = await crypto.subtle.importKey(
      "jwk",
      identity.publicJwk,
      { name: "ECDSA", namedCurve: "P-256" },
      false,
      ["verify"],
    );
    const verified = await crypto.subtle.verify(
      { name: "ECDSA", hash: "SHA-256" },
      key,
      Buffer.from(handshake.signature, "base64url"),
      new TextEncoder().encode(
        handshakeMessage(
          identity.deviceId,
          handshake.timestamp,
          handshake.nonce,
        ),
      ),
    );

    expect(verified).toBe(true);
    expect(identity.publicJwk.d).toBeUndefined();
    expect(statSync(keyPath).mode & 0o777).toBe(0o600);
  });
});
