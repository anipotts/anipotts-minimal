"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { createThought } from "../actions";
import Link from "next/link";
import { SERIES_OPTIONS } from "@/lib/constants";

type FormState = { error?: string; success?: boolean; id?: string } | null;

export default function QuickPostForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    async (_prev: FormState, formData: FormData) => {
      return (await createThought(formData)) as NonNullable<FormState>;
    },
    null,
  );

  if (state?.success && state.id) {
    return (
      <div className="bg-zinc-900 rounded-xl p-6 text-center space-y-4">
        <div className="text-green-400 text-lg font-medium">Created!</div>
        <Link
          href={`/content/${state.id}`}
          className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white transition-colors"
        >
          View Content
        </Link>
        <button
          onClick={() => router.refresh()}
          className="block mx-auto text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          Create Another
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && <p className="text-red-400 text-sm">{state.error}</p>}

      <input
        name="title"
        type="text"
        placeholder="Title"
        aria-label="Title"
        required
        autoFocus
        className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 placeholder:text-zinc-500 admin-input text-lg"
      />

      <textarea
        name="content"
        placeholder="Content (optional, add later)"
        aria-label="Content"
        rows={8}
        className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 placeholder:text-zinc-500 admin-input resize-y"
      />

      <select
        name="series_type"
        required
        aria-label="Series type"
        defaultValue=""
        className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 admin-input"
      >
        <option value="" disabled>
          Series Type
        </option>
        {SERIES_OPTIONS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg font-medium text-white transition-colors"
      >
        {isPending ? "Creating..." : "Create Draft"}
      </button>
    </form>
  );
}
