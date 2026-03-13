"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { login } from "./actions";

export default function LoginForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      const result = await login(formData);
      if ("success" in result && result.success) {
        router.refresh();
        return null;
      }
      return result as { error?: string };
    },
    null,
  );

  return (
    <form action={formAction} className="w-full max-w-sm space-y-4">
      <h2 className="text-xl font-semibold text-zinc-100 text-center">
        Content Admin
      </h2>

      {state?.error && (
        <p className="text-red-400 text-sm text-center">{state.error}</p>
      )}

      <input
        name="password"
        type="password"
        placeholder="Password"
        aria-label="Password"
        required
        autoFocus
        className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      />

      <input
        name="totp"
        type="text"
        inputMode="numeric"
        pattern="\d{6}"
        placeholder="TOTP (optional)"
        aria-label="TOTP code"
        maxLength={6}
        className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      />

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg font-medium text-white transition-colors"
      >
        {isPending ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}
