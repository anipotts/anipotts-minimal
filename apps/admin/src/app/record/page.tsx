import {
  getDrizzle,
  parseJsonArray,
  schema,
  desc,
  inArray,
} from "@anipotts/lib/db";
import type { Thought } from "@anipotts/types";
import Link from "next/link";
import { SERIES_COLORS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function RecordPage() {
  const db = getDrizzle();
  const thoughts: Thought[] = [];

  if (db) {
    const results = await db
      .select()
      .from(schema.thoughts)
      .where(inArray(schema.thoughts.status, ["ready", "draft"]))
      .orderBy(desc(schema.thoughts.updated_at))
      .limit(20);

    thoughts.push(
      ...results.map(
        (row) =>
          ({
            ...row,
            tags: parseJsonArray(row.tags),
            platforms_targeted: parseJsonArray(row.platforms_targeted),
            platforms_posted: parseJsonArray(row.platforms_posted),
            views: row.views ?? 0,
          }) as unknown as Thought,
      ),
    );
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
            href={`/record/${t.id}`}
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
