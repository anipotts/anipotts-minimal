"use client";

import { useActionState } from "react";
import { changeAdminPassword } from "../actions";

type State = { error?: string; success?: boolean } | null;

export default function PasswordForm({ csrfToken }: { csrfToken: string }) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: State, formData: FormData) => {
      const result = await changeAdminPassword(formData);
      if ("success" in result && result.success) {
        return { success: true };
      }
      return result as { error?: string };
    },
    null,
  );
  const error = state && "error" in state ? state.error : undefined;
  const success = state && "success" in state ? state.success : false;

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-lg border border-zinc-800/70 bg-zinc-950/40 p-4"
    >
      <input type="hidden" name="csrf" value={csrfToken} />
      <div>
        <h2 className="text-sm font-medium text-zinc-100">password</h2>
        <p className="mt-1 text-xs leading-relaxed text-zinc-500">
          cloudflare access stays in front. this password keeps the admin app
          signed in on this device for 30 days.
        </p>
      </div>

      {error && (
        <p className="rounded border border-red-900/50 bg-red-950/30 px-3 py-2 text-xs text-red-300">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded border border-emerald-900/50 bg-emerald-950/30 px-3 py-2 text-xs text-emerald-300">
          password changed. other sessions will need the new password when their
          token stops verifying.
        </p>
      )}

      <label className="block space-y-1">
        <span className="admin-label">current password</span>
        <input
          name="currentPassword"
          type="password"
          required
          className="admin-input w-full px-3 py-2 text-[13px] text-zinc-100"
        />
      </label>

      <label className="block space-y-1">
        <span className="admin-label">new password</span>
        <input
          name="nextPassword"
          type="password"
          minLength={12}
          maxLength={200}
          required
          className="admin-input w-full px-3 py-2 text-[13px] text-zinc-100"
        />
      </label>

      <label className="block space-y-1">
        <span className="admin-label">confirm new password</span>
        <input
          name="confirmPassword"
          type="password"
          minLength={12}
          maxLength={200}
          required
          className="admin-input w-full px-3 py-2 text-[13px] text-zinc-100"
        />
      </label>

      <button
        type="submit"
        disabled={isPending || !csrfToken}
        className="admin-pill rounded px-3 py-2 text-[11px] uppercase tracking-[0.16em] text-zinc-300 disabled:opacity-50"
      >
        {isPending ? "saving" : "change password"}
      </button>
    </form>
  );
}
