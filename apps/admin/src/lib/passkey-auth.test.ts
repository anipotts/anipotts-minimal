import { describe, expect, it } from "vitest";
import {
  authenticationOptions,
  logout,
  registrationOptions,
  revokeCurrentCredential,
  verifyAuthentication,
  verifyRegistration,
} from "./passkey-auth";

const services = [
  registrationOptions,
  verifyRegistration,
  authenticationOptions,
  verifyAuthentication,
  logout,
  revokeCurrentCredential,
];

function context(headers: Record<string, string>) {
  let databaseAccessed = false;
  return {
    context: {
      request: new Request(
        "https://admin.anipotts.com/api/admin/passkey/test",
        {
          method: "POST",
          headers,
          body: "{}",
        },
      ),
      url: new URL("https://admin.anipotts.com/api/admin/passkey/test"),
      locals: {
        runtime: {
          env: {
            get DB() {
              databaseAccessed = true;
              return undefined;
            },
          },
        },
      },
      cookies: { get: () => undefined },
    } as never,
    accessed: () => databaseAccessed,
  };
}

describe("passkey mutation boundary", () => {
  it.each(services)(
    "rejects malformed mutation headers before state access",
    async (service) => {
      const invalidHeaders: Array<Record<string, string>> = [
        { "content-type": "application/json", "x-admin-csrf": "same-origin" },
        {
          origin: "https://outside.invalid",
          "content-type": "application/json",
          "x-admin-csrf": "same-origin",
        },
        {
          origin: "https://admin.anipotts.com",
          "content-type": "text/plain",
          "x-admin-csrf": "same-origin",
        },
        {
          origin: "https://admin.anipotts.com",
          "content-type": "application/json",
        },
      ];
      for (const headers of invalidHeaders) {
        const test = context(headers);
        await expect(service(test.context)).rejects.toThrow();
        expect(test.accessed()).toBe(false);
      }
    },
  );
});
