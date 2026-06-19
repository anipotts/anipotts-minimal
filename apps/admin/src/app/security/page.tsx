import PasswordForm from "./password-form";
import { getAdminSecurityState } from "../actions";

export default async function SecurityPage() {
  const state = await getAdminSecurityState();
  if ("error" in state) {
    return (
      <main className="flex-1 overflow-y-auto admin-scroll p-6">
        <p className="text-sm text-red-400">{state.error}</p>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto admin-scroll p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="space-y-2">
          <p className="admin-label">admin security</p>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
            access stays outside, sessions get calmer
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-zinc-500">
            cloudflare access is still the perimeter. this page manages the
            app-level password and the 30-day device session behind it.
          </p>
        </header>

        <section className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-zinc-800/70 bg-zinc-950/40 p-4">
            <span className="admin-label">perimeter</span>
            <p className="mt-2 text-sm text-zinc-200">cloudflare access</p>
            <p className="mt-1 text-xs text-zinc-500">left enabled for now</p>
          </div>
          <div className="rounded-lg border border-zinc-800/70 bg-zinc-950/40 p-4">
            <span className="admin-label">password source</span>
            <p className="mt-2 text-sm text-zinc-200">
              {state.hasPasswordOverride ? "d1 override" : "wrangler secret"}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              changed passwords are stored as pbkdf2 hashes
            </p>
          </div>
        </section>

        <PasswordForm csrfToken={state.csrfToken} />

        <section className="rounded-lg border border-zinc-800/70 bg-zinc-950/40 p-4">
          <span className="admin-label">recent auth events</span>
          <div className="mt-3 space-y-2">
            {state.audit.length === 0 ? (
              <p className="text-xs text-zinc-600">no audit events yet</p>
            ) : (
              state.audit.map((event, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between gap-4 border-b border-zinc-900/80 pb-2 text-xs last:border-0 last:pb-0"
                >
                  <span className="text-zinc-300">{String(event.event)}</span>
                  <span className="text-zinc-600">{String(event.at)}</span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
