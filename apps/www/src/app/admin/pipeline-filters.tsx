'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const STATUSES = ['all', 'draft', 'ready', 'atomized', 'published'] as const
const SERIES = ['all', 'agent-tip', 'build-log', 'stack-drop', 'founders-log', 'viral-reel'] as const

export default function PipelineFilters({
  currentStatus,
  currentSeries,
  statusCounts,
}: {
  currentStatus: string
  currentSeries: string
  statusCounts: Record<string, number>
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function setFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'all') {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    router.push(`/admin?${params.toString()}`)
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter('status', s)}
            className={`shrink-0 text-sm px-3 py-1.5 rounded-full transition-colors ${
              currentStatus === s
                ? 'bg-indigo-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {s === 'all' ? 'All' : s}
            {s !== 'all' && statusCounts[s] ? ` (${statusCounts[s]})` : ''}
          </button>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
        {SERIES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter('series', s)}
            className={`shrink-0 text-sm px-3 py-1.5 rounded-full transition-colors ${
              currentSeries === s
                ? 'bg-indigo-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {s === 'all' ? 'All Series' : s}
          </button>
        ))}
      </div>
    </div>
  )
}
