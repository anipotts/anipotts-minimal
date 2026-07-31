import { describe, expect, it } from "vitest";
import {
  authenticationOptions,
  consumeChallenge,
  registrationOptions,
  verifyAuthentication,
  type ChallengeRow,
} from "./passkey-auth";
import type { AdminD1Database, AdminD1PreparedStatement } from "./admin-auth";

describe("passkey ceremonies", () => {
  it("requests discoverable credentials without a username or allow list", async () => {
    const db = new CeremonyDb({ activeCount: 2 });
    const response = await authenticationOptions(context(db));
    const body = (await response.json()) as {
      options: {
        allowCredentials?: unknown;
        userVerification?: string;
        hints?: string[];
      };
      challenge_id: string;
    };
    expect(body.options.allowCredentials).toBeUndefined();
    expect(body.options.userVerification).toBe("required");
    expect(body.options.hints).toEqual([
      "client-device",
      "hybrid",
      "security-key",
    ]);
    expect(body.challenge_id).toBeTruthy();
  });

  it("requires resident passkeys without a platform-only restriction", async () => {
    const db = new CeremonyDb({ activeCount: 0 });
    const response = await registrationOptions(context(db));
    const body = (await response.json()) as {
      options: {
        authenticatorSelection?: {
          residentKey?: string;
          userVerification?: string;
          authenticatorAttachment?: string;
        };
        hints?: string[];
      };
    };
    expect(body.options.authenticatorSelection?.residentKey).toBe("required");
    expect(body.options.authenticatorSelection?.userVerification).toBe(
      "required",
    );
    expect(
      body.options.authenticatorSelection?.authenticatorAttachment,
    ).toBeUndefined();
    expect(body.options.hints).toContain("hybrid");
  });

  it("consumes a challenge once and denies replay", async () => {
    const db = new CeremonyDb({ activeCount: 1 });
    const challenge = db.addChallenge("authentication");
    await expect(
      consumeChallenge(db, "authentication", challenge.id),
    ).resolves.toEqual(challenge);
    await expect(
      consumeChallenge(db, "authentication", challenge.id),
    ).rejects.toBeInstanceOf(Response);
  });

  it("denies a revoked credential before assertion verification", async () => {
    const db = new CeremonyDb({ activeCount: 1, activeCredential: null });
    const response = await verifyAuthentication(
      context(db, authenticationBody("revoked-credential")),
    ).catch((error: unknown) => error as Response);
    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({
      error: "credential_not_found",
    });
    expect(db.auditEvents).toContain("passkey.authentication.denied");
  });

  it("denies malformed assertions such as missing user verification", async () => {
    const credential = credentialRow("credential-1");
    const db = new CeremonyDb({ activeCount: 1, activeCredential: credential });
    const challenge = db.addChallenge("authentication");
    const response = await verifyAuthentication(
      context(db, authenticationBody(credential.credential_id, challenge.id)),
    ).catch((error: unknown) => error as Response);
    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: "authentication_verification_failed",
    });
    expect(db.auditEvents).toContain("passkey.authentication.denied");
  });
});

function context(db: AdminD1Database, body?: string) {
  const url = new URL("http://localhost:4311/api/admin/passkey/login-options");
  return {
    request: new Request(url, {
      method: "POST",
      headers: {
        origin: url.origin,
        ...(body ? { "content-type": "application/json" } : {}),
      },
      body,
    }),
    url,
    locals: { runtime: { env: { DB: db } } },
    cookies: { get: () => undefined },
  } as never;
}

function authenticationBody(credentialId: string, challengeId = "challenge-1") {
  return JSON.stringify({
    challenge_id: challengeId,
    credential: {
      id: credentialId,
      rawId: credentialId,
      type: "public-key",
      clientExtensionResults: {},
      response: {
        authenticatorData: "",
        clientDataJSON: "",
        signature: "",
        userHandle: null,
      },
    },
  });
}

function credentialRow(credentialId: string) {
  return {
    id: "credential-row-1",
    user_id: "ani",
    credential_id: credentialId,
    public_key: "AQID",
    counter: 0,
    transports: "[]",
    device_type: "singleDevice",
    backed_up: 0,
    created_at: "2026-07-31T15:00:00.000Z",
    last_used_at: null,
    revoked_at: null,
  };
}

class CeremonyDb implements AdminD1Database {
  readonly auditEvents: string[] = [];
  readonly challenges = new Map<string, ChallengeRow>();
  private activeCount: number;
  private activeCredential: ReturnType<typeof credentialRow> | null;

  constructor(input: {
    activeCount: number;
    activeCredential?: ReturnType<typeof credentialRow> | null;
  }) {
    this.activeCount = input.activeCount;
    this.activeCredential = input.activeCredential ?? null;
  }

  prepare(query: string): AdminD1PreparedStatement {
    return new CeremonyStatement(this, query);
  }

  addChallenge(purpose: ChallengeRow["purpose"]): ChallengeRow {
    const row: ChallengeRow = {
      id: "challenge-1",
      purpose,
      challenge: "challenge-value",
      credential_id: null,
      user_id: null,
      session_id: null,
      invite_id: null,
      recovery_session_id: null,
      request_origin: "http://localhost:4311",
      metadata: "{}",
      created_at: "2026-07-31T15:59:00.000Z",
      expires_at: new Date(Date.now() + 60_000).toISOString(),
      used_at: null,
    };
    this.challenges.set(row.id, row);
    return row;
  }

  first(query: string, values: unknown[]): unknown {
    if (query.includes("COUNT(*)") && query.includes("revoked_at IS NULL")) {
      return { count: this.activeCount };
    }
    if (
      query.includes("COUNT(*)") &&
      query.includes("revoked_at IS NOT NULL")
    ) {
      return { count: 1 };
    }
    if (
      query.includes("FROM admin_passkey_credentials") &&
      query.includes("credential_id =")
    ) {
      return this.activeCredential;
    }
    if (query.includes("FROM admin_passkey_challenges")) {
      const row = this.challenges.get(String(values[0]));
      return row && !row.used_at ? row : null;
    }
    return null;
  }

  all(query: string): unknown[] {
    if (query.includes("FROM admin_passkey_credentials")) return [];
    return [];
  }

  run(query: string, values: unknown[]): { meta: { changes: number } } {
    if (query.includes("INSERT INTO admin_passkey_challenges")) {
      const row: ChallengeRow = {
        id: String(values[0]),
        purpose: values[1] as ChallengeRow["purpose"],
        challenge: String(values[2]),
        user_id: (values[3] as string | null) ?? null,
        session_id: (values[4] as string | null) ?? null,
        invite_id: (values[5] as string | null) ?? null,
        recovery_session_id: (values[6] as string | null) ?? null,
        request_origin: String(values[7]),
        metadata: String(values[8]),
        created_at: String(values[9]),
        expires_at: String(values[10]),
        credential_id: null,
        used_at: null,
      };
      this.challenges.set(row.id, row);
      return { meta: { changes: 1 } };
    }
    if (query.includes("UPDATE admin_passkey_challenges")) {
      const row = this.challenges.get(String(values[1]));
      if (!row || row.used_at) return { meta: { changes: 0 } };
      row.used_at = String(values[0]);
      return { meta: { changes: 1 } };
    }
    if (query.includes("INSERT INTO admin_passkey_audit")) {
      this.auditEvents.push(String(values[1]));
    }
    return { meta: { changes: 1 } };
  }
}

class CeremonyStatement implements AdminD1PreparedStatement {
  private values: unknown[] = [];

  constructor(
    private readonly db: CeremonyDb,
    private readonly query: string,
  ) {}

  bind(...values: unknown[]): AdminD1PreparedStatement {
    this.values = values;
    return this;
  }

  async first<T = unknown>(): Promise<T | null> {
    return (this.db.first(this.query, this.values) as T | null) ?? null;
  }

  async run() {
    return this.db.run(this.query, this.values);
  }

  async all<T = unknown>() {
    return { results: this.db.all(this.query) as T[] };
  }
}
