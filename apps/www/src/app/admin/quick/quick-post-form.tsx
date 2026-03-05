'use client'

import { useActionState } from 'react'
import { createThought } from '../actions'
import Link from 'next/link'

const SERIES_OPTIONS = [
  { value: 'agent-tip', label: 'Agent Tip' },
  { value: 'build-log', label: 'Build Log' },
  { value: 'stack-drop', label: 'Stack Drop' },
  { value: 'founders-log', label: "Founder's Log" },
  { value: 'viral-reel', label: 'Viral Reel' },
] as const

export default function QuickPostForm() {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string; success?: boolean; id?: string } | null, formData: FormData) => {
      return await createThought(formData)
    },
    null
  )

  if (state?.success && state.id) {
    return (
      <div className="bg-zinc-900 rounded-xl p-6 text-center space-y-4">
        <div className="text-green-400 text-lg font-medium">Created!</div>
        <Link
          href={`/admin/content/${state.id}`}
          className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white transition-colors"
        >
          View Content
        </Link>
        <button
          onClick={() => window.location.reload()}
          className="block mx-auto text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          Create Another
        </button>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <p className="text-red-400 text-sm">{state.error}</p>
      )}

      <input
        name="title"
        type="text"
        placeholder="Title"
        required
        autoFocus
        className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
      />

      <textarea
        name="content"
        placeholder="Content (optional — add later)"
        rows={8}
        className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y"
      />

      <select
        name="series_type"
        required
        defaultValue=""
        className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
        {isPending ? 'Creating...' : 'Create Draft'}
      </button>
    </form>
  )
}
