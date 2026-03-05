import { createServerClient } from "@anipotts/lib";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Thought, Atom, SeriesType } from "@anipotts/types";
import StatusActions from "./status-actions";

const SERIES_COLORS: Record<SeriesType, string> = {
  "agent-tip": "bg-blue-500/20 text-blue-400",
  "build-log": "bg-green-500/20 text-green-400",
  "stack-drop": "bg-purple-500/20 text-purple-400",
  "founders-log": "bg-amber-500/20 text-amber-400",
  "viral-reel": "bg-pink-500/20 text-pink-400",
};

const PLATFORM_COLORS: Record<string, string> = {
  twitter: "text-sky-400",
  linkedin: "text-blue-400",
  tiktok: "text-pink-400",
  instagram: "text-orange-400",
  threads: "text-zinc-300",
  bluesky: "text-blue-300",
  youtube: "text-red-400",
};

export const dynamic = "force-dynamic";

export default async function ContentDetailPage({
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

  const { data: atoms } = await supabase
    .from("atoms")
    .select("*")
    .eq("content_id", id)
    .order("created_at", { ascending: false });

  const t = thought as Thought;
  const status = t.status || "draft";

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin"
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
        <h2 className="text-lg font-semibold flex-1 truncate">{t.title}</h2>
      </div>

      <div className="bg-zinc-900 rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              status === "draft"
                ? "bg-yellow-500/20 text-yellow-400"
                : status === "ready"
                  ? "bg-blue-500/20 text-blue-400"
                  : status === "published"
                    ? "bg-green-500/20 text-green-400"
                    : "bg-zinc-700 text-zinc-300"
            }`}
          >
            {status}
          </span>

          {t.series_type && (
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${SERIES_COLORS[t.series_type] || ""}`}
            >
              {t.series_type}
            </span>
          )}

          {t.content_type && (
            <span className="text-xs text-zinc-500">{t.content_type}</span>
          )}
        </div>

        {t.artifact_url && (
          <a
            href={t.artifact_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-indigo-400 hover:text-indigo-300 break-all"
          >
            {t.artifact_type ? `${t.artifact_type}: ` : ""}
            {t.artifact_url}
          </a>
        )}

        <div className="text-xs text-zinc-500 space-x-4">
          <span>Created: {new Date(t.created_at).toLocaleDateString()}</span>
          {t.published_at && (
            <span>
              Published: {new Date(t.published_at).toLocaleDateString()}
            </span>
          )}
        </div>

        <StatusActions id={t.id} currentStatus={status} />
      </div>

      {t.content && (
        <div className="bg-zinc-900 rounded-xl p-4">
          <h3 className="text-sm font-medium text-zinc-400 mb-2">Content</h3>
          <div className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
            {t.content}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-zinc-400">
            Atoms ({(atoms as Atom[])?.length || 0})
          </h3>
          <Link
            href={`/admin/record/${t.id}`}
            className="text-xs px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-300 transition-colors"
          >
            Recording Prep
          </Link>
        </div>

        {(!atoms || atoms.length === 0) && (
          <p className="text-zinc-600 text-sm">No atoms yet</p>
        )}

        {(atoms as Atom[])?.map((atom) => (
          <div key={atom.id} className="bg-zinc-900 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span
                className={`text-sm font-medium ${PLATFORM_COLORS[atom.platform] || "text-zinc-300"}`}
              >
                {atom.platform}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  atom.status === "posted"
                    ? "bg-green-500/20 text-green-400"
                    : atom.status === "scheduled"
                      ? "bg-blue-500/20 text-blue-400"
                      : "bg-zinc-700 text-zinc-300"
                }`}
              >
                {atom.status}
              </span>
            </div>
            <p className="text-sm text-zinc-400 line-clamp-3">
              {atom.atom_content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
