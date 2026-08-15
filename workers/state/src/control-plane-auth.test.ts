import { describe, expect, it } from "bun:test";
import { handshakeMessage, verifyDeviceHandshake } from "./control-plane-auth";

describe("device handshake", () => {
  it("accepts a current ap-mini signature and rejects replay-aged input", async () => {
    const pair = (await crypto.subtle.generateKey(
      { name: "ECDSA", namedCurve: "P-256" },
      true,
      ["sign", "verify"],
    )) as CryptoKeyPair;
    const publicJwk = await crypto.subtle.exportKey("jwk", pair.publicKey);
    const timestamp = "2026-07-31T12:00:00.000Z";
    const nonce = "abcdefghijklmnopqrstuv";
    const signature = await crypto.subtle.sign(
      { name: "ECDSA", hash: "SHA-256" },
      pair.privateKey,
      new TextEncoder().encode(handshakeMessage("ap-mini", timestamp, nonce)),
    );
    const request = new Request("https://api.anipotts.com/control", {
      headers: {
        "x-control-timestamp": timestamp,
        "x-control-nonce": nonce,
        "x-control-signature": Buffer.from(signature).toString("base64url"),
      },
    });

    expect(
      await verifyDeviceHandshake(
        request,
        "ap-mini",
        JSON.stringify(publicJwk),
        Date.parse(timestamp) + 10_000,
      ),
    ).toMatchObject({ deviceId: "ap-mini", nonce, timestamp });
    expect(
      await verifyDeviceHandshake(
        request,
        "ap-mini",
        JSON.stringify(publicJwk),
        Date.parse(timestamp) + 61_000,
      ),
    ).toBeNull();
  });
});
