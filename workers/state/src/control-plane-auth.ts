const MAX_HANDSHAKE_AGE_MS = 60_000;

type DeviceHandshake = {
  deviceId: "ap-mini";
  nonce: string;
  timestamp: string;
  signature: string;
};

export async function verifyDeviceHandshake(
  request: Request,
  expectedDeviceId: string,
  publicJwkText: string | undefined,
  now = Date.now(),
): Promise<DeviceHandshake | null> {
  if (expectedDeviceId !== "ap-mini" || !publicJwkText) return null;

  const timestamp = request.headers.get("x-control-timestamp") ?? "";
  const nonce = request.headers.get("x-control-nonce") ?? "";
  const signature = request.headers.get("x-control-signature") ?? "";
  const parsedTimestamp = Date.parse(timestamp);

  if (
    !Number.isFinite(parsedTimestamp) ||
    Math.abs(now - parsedTimestamp) > MAX_HANDSHAKE_AGE_MS ||
    !/^[A-Za-z0-9_-]{22,128}$/.test(nonce) ||
    !/^[A-Za-z0-9_-]{40,256}$/.test(signature)
  ) {
    return null;
  }

  let publicJwk: JsonWebKey;
  try {
    publicJwk = JSON.parse(publicJwkText) as JsonWebKey;
  } catch {
    return null;
  }

  try {
    const key = await crypto.subtle.importKey(
      "jwk",
      publicJwk,
      { name: "ECDSA", namedCurve: "P-256" },
      false,
      ["verify"],
    );
    const verified = await crypto.subtle.verify(
      { name: "ECDSA", hash: "SHA-256" },
      key,
      fromBase64Url(signature),
      new TextEncoder().encode(
        handshakeMessage(expectedDeviceId, timestamp, nonce),
      ),
    );
    if (!verified) return null;
  } catch {
    return null;
  }

  return { deviceId: "ap-mini", nonce, timestamp, signature };
}

export function handshakeMessage(
  deviceId: string,
  timestamp: string,
  nonce: string,
): string {
  return `${deviceId}\n${timestamp}\n${nonce}`;
}

function fromBase64Url(value: string): Uint8Array<ArrayBuffer> {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}
