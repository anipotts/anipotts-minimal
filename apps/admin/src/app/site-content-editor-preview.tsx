"use client";

import { ArrowSquareOut } from "@phosphor-icons/react";
import type {
  CmsProjectContent,
  CmsWritingContent,
  NewsletterContent,
} from "@anipotts/types";

function formatSaved(value: string | null) {
  if (!value) return "not saved";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function PreviewPanel({
  project,
  writing,
  newsletter,
  newsletterSavedAt,
}: {
  project: CmsProjectContent | null;
  writing: CmsWritingContent | null;
  newsletter: NewsletterContent | null;
  newsletterSavedAt: string | null;
}) {
  return (
    <aside className="rounded-md border border-zinc-800/60 bg-black/20 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
          public preview
        </h3>
        {(project || writing) && (
          <a
            href={
              project
                ? `https://anipotts.com/projects/${project.slug}`
                : `https://anipotts.com/writing/${writing?.slug}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-600 transition-colors hover:text-zinc-300"
            aria-label="open public page"
          >
            <ArrowSquareOut size={14} />
          </a>
        )}
      </div>

      {project && (
        <div className="space-y-3">
          <div>
            <h4 className="text-[20px] font-semibold text-zinc-100">
              {project.title || "untitled project"}
            </h4>
            <p className="mt-1 text-[12px] text-zinc-600">
              {project.status} / {project.year} / {project.range}
            </p>
          </div>
          <p className="text-[13px] leading-relaxed text-zinc-300">
            {project.summary}
          </p>
          <p className="whitespace-pre-wrap text-[12px] leading-relaxed text-zinc-500">
            {project.body}
          </p>
        </div>
      )}

      {writing && (
        <div className="space-y-3">
          <div>
            <h4 className="text-[20px] font-semibold text-zinc-100">
              {writing.title || "untitled writing"}
            </h4>
            <p className="mt-1 text-[12px] text-zinc-600">
              {writing.visible ? "published" : "draft"} / {writing.date}
            </p>
          </div>
          <p className="text-[13px] leading-relaxed text-zinc-300">
            {writing.preview}
          </p>
          <p className="whitespace-pre-wrap text-[12px] leading-relaxed text-zinc-500">
            {writing.body}
          </p>
        </div>
      )}

      {newsletter && (
        <div className="space-y-3">
          <p className="text-[10px] uppercase tracking-wide text-zinc-600">
            saved {formatSaved(newsletterSavedAt)}
          </p>
          <h4 className="text-[20px] font-semibold text-zinc-100">
            {newsletter.headline}
          </h4>
          <p className="text-[13px] leading-relaxed text-zinc-300">
            {newsletter.deck}
          </p>
          <button
            type="button"
            className="rounded-md bg-zinc-100 px-3 py-2 text-[12px] font-medium text-zinc-950"
          >
            {newsletter.cta_label}
          </button>
          <p className="text-[11px] leading-relaxed text-zinc-600">
            {newsletter.footer_text}
          </p>
        </div>
      )}
    </aside>
  );
}
