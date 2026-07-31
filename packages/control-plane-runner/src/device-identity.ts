import { chmodSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

export type DeviceIdentity = {
  deviceId: "ap-mini";
  privateJwk: JsonWebKey;
  publicJwk: JsonWebKey;
};

export type SignedHandshake = {
  timestamp: string;
  nonce: string;
  signature: string;
};

export async function provisionDeviceIdentity(
  privateKeyPath: string,
): Promise<DeviceIdentity> {
  mkdirSync(dirname(privateKeyPath), { recursive: true, mode: 0o700 });
  const existing = readIdentity(privateKeyPath);
  if (existing) return existing;

  const pair = (await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"],
  )) as CryptoKeyPair;
  const privateJwk = await crypto.subtle.exportKey("jwk", pair.privateKey);
  const publicJwk = await crypto.subtle.exportKey("jwk", pair.publicKey);
  writeFileSync(privateKeyPath, `${JSON.stringify(privateJwk)}\n`, {
    mode: 0o600,
    flag: "wx",
  });
  chmodSync(privateKeyPath, 0o600);
  return { deviceId: "ap-mini", privateJwk, publicJwk };
}

export function loadDeviceIdentity(privateKeyPath: string): DeviceIdentity {
  const identity = readIdentity(privateKeyPath);
  if (!identity) {
    throw new Error(
      `device identity missing; run provision before start (${privateKeyPath})`,
    );
  }
  chmodSync(privateKeyPath, 0o600);
  return identity;
}

export async function signHandshake(
  identity: DeviceIdentity,
  now = new Date(),
  nonce = randomNonce(),
): Promise<SignedHandshake> {
  const timestamp = now.toISOString();
  const key = await crypto.subtle.importKey(
    "jwk",
    identity.privateJwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    new TextEncoder().encode(
      handshakeMessage(identity.deviceId, timestamp, nonce),
    ),
  );
  return { timestamp, nonce, signature: toBase64Url(signature) };
}

export function handshakeMessage(
  deviceId: string,
  timestamp: string,
  nonce: string,
): string {
  return `${deviceId}\n${timestamp}\n${nonce}`;
}

function readIdentity(privateKeyPath: string): DeviceIdentity | null {
  try {
    const privateJwk = JSON.parse(
      readFileSync(privateKeyPath, "utf8"),
    ) as JsonWebKey;
    if (
      privateJwk.kty !== "EC" ||
      privateJwk.crv !== "P-256" ||
      !privateJwk.d ||
      !privateJwk.x ||
      !privateJwk.y
    ) {
      throw new Error("invalid ap-mini device identity");
    }
    const publicJwk: JsonWebKey = {
      kty: privateJwk.kty,
      crv: privateJwk.crv,
      x: privateJwk.x,
      y: privateJwk.y,
      ext: true,
      key_ops: ["verify"],
    };
    return { deviceId: "ap-mini", privateJwk, publicJwk };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

function randomNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return toBase64Url(bytes);
}

function toBase64Url(value: ArrayBuffer | Uint8Array): string {
  return Buffer.from(
    value instanceof Uint8Array ? value : new Uint8Array(value),
  ).toString("base64url");
}
