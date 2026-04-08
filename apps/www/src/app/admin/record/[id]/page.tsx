import { createServerClient } from "@anipotts/lib";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Thought, SeriesType } from "@anipotts/types";
import Teleprompter from "./teleprompter";

const TIMING: Record<SeriesType, string> = {
  tip: "30-60s",
  news: "1-2 min",
  tutorial: "5-15 min",
  essay: "3-10 min",
  "behind-the-scenes": "1-3 min",
};

function extractBulletPoints(content: string): {
  hook: string;
  body: string[];
  outro: string;
} {
  const lines = content
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return {
      hook: "No content yet",
      body: [],
      outro: "",
    };
  }

  // First line or sentence is the hook
  const hook = (lines[0] ?? "No content yet").replace(/^#+\s*/, "");

  // Last line is outro/CTA
  const outro =
    lines.length > 1
      ? (lines[lines.length - 1] ?? "").replace(/^#+\s*/, "")
      : "";

  // Middle lines are body bullets
  const body = lines
    .slice(1, -1)
    .map((l) => l.replace(/^[-*•]\s*/, "").replace(/^#+\s*/, ""))
    .filter((l) => l.length > 5)
    .slice(0, 5);

  return { hook, body, outro };
}

export const dynamic = "force-dynamic";

export default async function RecordingPrepPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createServerClient();
  if (!supabase) notFound();

  const { data: thought } = await supabase
    .from("thoughts")
    .select("*")
    .eq("id", id)
    .single();

  if (!thought) notFound();

  const t = thought as Thought;
  const timing = t.series_type ? TIMING[t.series_type] : "30-60s";
  const points = extractBulletPoints(t.content || "");

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="flex items-center gap-3 p-4 bg-zinc-900/50">
        <Link
          href={`/content/${t.id}`}
          className="text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5L8.25 12l7.5-7.5"
            />
          </svg>
        </Link>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-medium truncate">{t.title}</h2>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            {t.series_type && <span>{t.series_type}</span>}
            <span className="text-amber-400">Target: {timing}</span>
          </div>
        </div>
      </div>

      <Teleprompter
        hook={points.hook}
        body={points.body}
        outro={points.outro}
      />
    </div>
  );
}
