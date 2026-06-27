import {
  startAuthentication,
  startRegistration,
} from "@simplewebauthn/browser";
import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from "@simplewebauthn/server";
import { createSignal, onMount, Show } from "solid-js";
import {
  ControlPlaneLayout,
  Fact,
  SectionHeader,
} from "~/components/ControlPlane";
import type { PasskeyStatus } from "~/lib/passkey-auth";

type ApiResult = {
  verified?: boolean;
  ok?: boolean;
  error?: string;
  detail?: string;
  next_safe_action?: string;
};

export default function PasskeyAuthRoute() {
  const [status, setStatus] = createSignal<PasskeyStatus | null>(null);
  const [message, setMessage] = createSignal("ready");
  const [busy, setBusy] = createSignal(false);

  onMount(() => {
    void refreshStatus();
  });

  async function refreshStatus() {
    const response = await fetch("/api/admin/passkey/status", {
      cache: "no-store",
    });
    setStatus((await response.json()) as PasskeyStatus);
  }

  async function register() {
    setBusy(true);
    setMessage("starting passkey registration");
    try {
      const options = await postJson<PublicKeyCredentialCreationOptionsJSON>(
        "/api/admin/passkey/register-options",
      );
      const credential = await startRegistration({ optionsJSON: options });
      const result = await postJson(
        "/api/admin/passkey/register-verify",
        credential,
      );
      setMessage(result.next_safe_action ?? "passkey registered");
      await refreshStatus();
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function authenticate() {
    setBusy(true);
    setMessage("starting passkey authentication");
    try {
      const options = await postJson<PublicKeyCredentialRequestOptionsJSON>(
        "/api/admin/passkey/login-options",
      );
      const assertion = await startAuthentication({ optionsJSON: options });
      const result = await postJson(
        "/api/admin/passkey/login-verify",
        assertion,
      );
      setMessage(result.next_safe_action ?? "passkey session active");
      await refreshStatus();
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    setBusy(true);
    setMessage("clearing passkey session");
    try {
      const result = await postJson("/api/admin/passkey/logout");
      setMessage(result.next_safe_action ?? "session cleared");
      await refreshStatus();
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <ControlPlaneLayout
      title="passkey auth staging"
      deck="Biometric passkey auth is implemented behind Cloudflare Access first. This route does not remove the edge gate."
    >
      <section>
        <SectionHeader
          eyebrow="auth boundary"
          title="passkey behind Access"
          detail="staging surface"
        />
        <div class="grid two">
          <article class="panel-card">
            <div class="card-top">
              <div>
                <p class="eyebrow">status</p>
                <h3>app-native session</h3>
              </div>
              <span class="model-chip">
                {status()?.has_session ? "active" : "inactive"}
              </span>
            </div>
            <div class="fact-grid">
              <Fact
                label="db"
                value={status()?.available ? "available" : "missing"}
              />
              <Fact
                label="credentials"
                value={String(status()?.credential_count ?? 0)}
              />
              <Fact
                label="access_identity"
                value={
                  status()?.access_identity_present
                    ? (status()?.access_identity_hint ?? "present")
                    : "missing"
                }
              />
              <Fact
                label="can_register"
                value={String(status()?.can_register ?? false)}
              />
            </div>
            <p class="proof-line">{status()?.next_safe_action ?? "loading"}</p>
          </article>

          <article class="panel-card">
            <div class="card-top">
              <div>
                <p class="eyebrow">operator action</p>
                <h3>Touch ID / Face ID passkey</h3>
              </div>
            </div>
            <div class="button-row">
              <button
                class="control-button"
                disabled={busy() || !status()?.can_register}
                onClick={() => void register()}
                type="button"
              >
                register passkey
              </button>
              <button
                class="control-button"
                disabled={busy() || !status()?.available}
                onClick={() => void authenticate()}
                type="button"
              >
                authenticate
              </button>
              <button
                class="control-button secondary"
                disabled={busy() || !status()?.has_session}
                onClick={() => void logout()}
                type="button"
              >
                logout
              </button>
            </div>
            <p class="proof-line">{message()}</p>
          </article>
        </div>
      </section>

      <section>
        <SectionHeader
          eyebrow="removal gate"
          title="Cloudflare Access stays on"
          detail="proof required first"
        />
        <article class="panel-card gate-panel">
          <div class="fact-grid">
            <Fact
              label="allowed_now"
              value="register and authenticate passkeys behind Access"
            />
            <Fact
              label="blocked_now"
              value="Access removal, DNS mutation, public exposure, write paths"
            />
            <Fact
              label="proof_needed"
              value="two trusted devices, logout, revoke, unauth block, rollback"
            />
            <Fact
              label="rollback"
              value="restore Cloudflare Access policy before removing edge gate"
            />
          </div>
        </article>
      </section>

      <Show when={!status()?.available}>
        <section>
          <SectionHeader
            eyebrow="setup"
            title="database migration required"
            detail="no live mutation from this route"
          />
          <article class="panel-card">
            <p class="proof-line">
              apply `drizzle/migrations/0006_admin_passkeys.sql` and deploy the
              admin-solid DB binding before enrollment.
            </p>
          </article>
        </section>
      </Show>
    </ControlPlaneLayout>
  );
}

async function postJson<TResponse = ApiResult>(
  path: string,
  body?: unknown,
): Promise<TResponse> {
  const response = await fetch(path, {
    method: "POST",
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = (await response.json()) as TResponse;
  const apiData = data as ApiResult;
  if (!response.ok) {
    throw new Error(
      apiData.detail ?? apiData.error ?? `request failed: ${response.status}`,
    );
  }
  return data;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "passkey request failed";
}
