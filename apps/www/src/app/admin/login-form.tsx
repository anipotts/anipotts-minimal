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
    <form action={formAction} className="w-full max-w-xs space-y-4">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-medium text-body tracking-tight font-mono">
          admin
        </h2>
        <p className="text-[10px] uppercase tracking-[0.16em] text-faint font-mono">
          anipotts.com
        </p>
      </div>

      {state?.error && (
        <p className="text-red-400 text-xs text-center font-mono">
          {state.error}
        </p>
      )}

      <input
        name="password"
        type="password"
        placeholder="password"
        aria-label="Password"
        required
        autoFocus
        className="w-full px-3 py-2.5 bg-input border border-border rounded-sm text-body placeholder:text-faint focus:border-white/20 focus:outline-none focus-visible:outline-none focus-visible:[box-shadow:none] transition-colors text-sm font-mono tracking-wider"
      />

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-2 bg-input border border-border hover:border-white/20 disabled:opacity-50 rounded-sm font-mono text-muted hover:text-body transition-colors text-xs uppercase tracking-[0.16em]"
      >
        {isPending ? "..." : "enter"}
      </button>
    </form>
  );
}
