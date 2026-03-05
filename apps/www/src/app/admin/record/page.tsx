import { createServerClient } from "@anipotts/lib";
import type { Thought, SeriesType } from "@anipotts/types";
import Link from "next/link";

const SERIES_COLORS: Record<SeriesType, string> = {
  "agent-tip": "bg-blue-500/20 text-blue-400",
  "build-log": "bg-green-500/20 text-green-400",
  "stack-drop": "bg-purple-500/20 text-purple-400",
  "founders-log": "bg-amber-500/20 text-amber-400",
  "viral-reel": "bg-pink-500/20 text-pink-400",
};

export const dynamic = "force-dynamic";

export default async function RecordPage() {
  const supabase = createServerClient();
  const thoughts: Thought[] = [];

  if (supabase) {
    const { data } = await supabase
      .from("thoughts")
      .select("*")
      .in("status", ["ready", "draft"])
      .order("updated_at", { ascending: false })
      .limit(20);

    if (data) thoughts.push(...(data as Thought[]));
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold">Recording Prep</h2>
      <p className="text-sm text-zinc-500">
        Select content to prepare teleprompter notes.
      </p>

      <div className="space-y-3">
        {thoughts.length === 0 && (
          <p className="text-zinc-600 text-center py-8">
            No draft/ready content
          </p>
        )}

        {thoughts.map((t) => (
          <Link
            key={t.id}
            href={`/admin/record/${t.id}`}
            className="block bg-zinc-900 rounded-xl p-4 active:bg-zinc-800 transition-colors"
          >
            <h3 className="font-medium text-zinc-100 truncate">{t.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              {t.series_type && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${SERIES_COLORS[t.series_type]}`}
                >
                  {t.series_type}
                </span>
              )}
              <span className="text-xs text-zinc-600">
                {t.status || "draft"}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
