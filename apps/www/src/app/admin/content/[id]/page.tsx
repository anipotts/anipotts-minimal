import { createServerClient } from "@anipotts/lib";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Thought, Atom } from "@anipotts/types";
import StatusActions from "./status-actions";
import EditableContent from "./editable-content";
import AtomManager from "./atom-manager";
import ButtondownCard from "./buttondown-card";
import { SERIES_COLORS, STATUS_COLORS, PLATFORM_ABBREV } from "@/lib/constants";

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
    <div className="h-screen flex flex-col">
      {/* Top bar */}
      <div className="shrink-0 border-b border-zinc-800 px-6 py-3 flex items-center justify-between bg-zinc-900/50">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/"
            className="text-zinc-500 hover:text-zinc-300 transition-colors shrink-0"
          >
            <svg
              className="w-4 h-4"
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
          <h2 className="text-sm font-medium truncate">{t.title}</h2>
          <span
            className={`text-[11px] px-2 py-0.5 rounded-full shrink-0 ${STATUS_COLORS[status] || STATUS_COLORS.idea}`}
          >
            {status}
          </span>
          {t.series_type && (
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full shrink-0 ${SERIES_COLORS[t.series_type] || ""}`}
            >
              {t.series_type}
            </span>
          )}
        </div>
        <a
          href={`https://anipotts.com/thoughts/${t.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1 shrink-0"
        >
          View on site
          <svg
            className="w-3 h-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
            />
          </svg>
        </a>
      </div>

      {/* Two-panel layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel: Editor (takes most space) */}
        <div className="flex-1 overflow-y-auto admin-scroll p-6">
          <EditableContent
            id={t.id}
            title={t.title}
            summary={t.summary || ""}
            content={t.content || ""}
            tags={Array.isArray(t.tags) ? t.tags : []}
          />
        </div>

        {/* Right panel: Metadata, Actions, Distribution */}
        <div className="w-80 shrink-0 border-l border-zinc-800 overflow-y-auto admin-scroll">
          <div className="p-4 space-y-4">
            {/* Status + Actions */}
            <section>
              <h4 className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-2">
                Status
              </h4>
              <StatusActions id={t.id} currentStatus={status} />
            </section>

            {/* Metadata */}
            <section>
              <h4 className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-2">
                Details
              </h4>
              <div className="text-xs text-zinc-400 space-y-1.5">
                {t.content_type && (
                  <div>
                    Type:{" "}
                    <span className="text-zinc-300">{t.content_type}</span>
                  </div>
                )}
                <div>
                  Created:{" "}
                  <span className="text-zinc-300">
                    {new Date(t.created_at).toLocaleDateString()}
                  </span>
                </div>
                {t.published_at && (
                  <div>
                    Published:{" "}
                    <span className="text-zinc-300">
                      {new Date(t.published_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <div>
                  Views: <span className="text-zinc-300">{t.views}</span>
                </div>
                {t.artifact_url && (
                  <div>
                    Artifact:{" "}
                    <a
                      href={t.artifact_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-400 hover:text-indigo-300 break-all"
                    >
                      {t.artifact_type || "link"}
                    </a>
                  </div>
                )}
              </div>

              {t.platforms_posted && t.platforms_posted.length > 0 && (
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-[11px] text-zinc-500">Posted:</span>
                  {t.platforms_posted.map((p) => (
                    <span
                      key={p}
                      className="text-[10px] px-1.5 py-0.5 bg-green-500/10 text-green-400 rounded"
                    >
                      {PLATFORM_ABBREV[p] || p}
                    </span>
                  ))}
                </div>
              )}
            </section>

            {/* Buttondown */}
            <section>
              <h4 className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-2">
                Email
              </h4>
              <ButtondownCard contentId={t.id} />
            </section>

            {/* Atoms */}
            <section>
              <h4 className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-2">
                Distribution
              </h4>
              <AtomManager contentId={t.id} atoms={(atoms as Atom[]) || []} />
            </section>

            {/* Recording */}
            <section className="pb-4">
              <Link
                href={`/record/${t.id}`}
                className="text-xs px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-md text-zinc-400 transition-colors block text-center"
              >
                Teleprompter
              </Link>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
