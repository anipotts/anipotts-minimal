"use client";

import type { ReactNode } from "react";
import { ArrowSquareOut } from "@phosphor-icons/react";
import type {
  CmsProjectContent,
  CmsWritingContent,
  NewsletterContent,
} from "@anipotts/types";

function csv(tags: string[]) {
  return tags.join(", ");
}

function parseTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 12);
}

function formatSaved(value: string | null) {
  if (!value) return "not saved";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-600">
        {label}
      </span>
      {children}
    </label>
  );
}

export function ProjectForm({
  project,
  update,
}: {
  project: CmsProjectContent;
  update: (patch: Partial<CmsProjectContent>) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-[1fr_120px_120px]">
        <Field label="title">
          <input
            value={project.title}
            onChange={(event) => update({ title: event.target.value })}
            className="admin-input px-3 py-2 text-[13px] text-zinc-100"
          />
        </Field>
        <Field label="status">
          <select
            value={project.status}
            onChange={(event) =>
              update({
                status: event.target.value as CmsProjectContent["status"],
              })
            }
            className="admin-input px-3 py-2 text-[12px] text-zinc-200"
          >
            <option value="live">live</option>
            <option value="wip">wip</option>
            <option value="archived">archived</option>
          </select>
        </Field>
        <Field label="year">
          <input
            value={project.year}
            onChange={(event) => update({ year: event.target.value })}
            className="admin-input px-3 py-2 text-[12px] text-zinc-200"
          />
        </Field>
      </div>
      <div className="grid gap-3 md:grid-cols-[1fr_1fr]">
        <Field label="slug">
          <input
            value={project.slug}
            onChange={(event) => update({ slug: event.target.value })}
            className="admin-input px-3 py-2 text-[12px] text-zinc-200"
          />
        </Field>
        <Field label="range">
          <input
            value={project.range}
            onChange={(event) => update({ range: event.target.value })}
            className="admin-input px-3 py-2 text-[12px] text-zinc-200"
          />
        </Field>
      </div>
      <Field label="tags">
        <input
          value={csv(project.tags)}
          onChange={(event) => update({ tags: parseTags(event.target.value) })}
          className="admin-input px-3 py-2 text-[12px] text-zinc-200"
        />
      </Field>
      <Field label="summary">
        <textarea
          value={project.summary}
          onChange={(event) => update({ summary: event.target.value })}
          rows={3}
          className="admin-editor resize-y px-3 py-2 text-[13px] text-zinc-200"
        />
      </Field>
      <Field label="body / notes">
        <textarea
          value={project.body}
          onChange={(event) => update({ body: event.target.value })}
          rows={9}
          className="admin-editor resize-y px-3 py-2 text-[13px] leading-relaxed text-zinc-200"
        />
      </Field>
      <LinkEditor links={project.links} update={(links) => update({ links })} />
      <div className="flex flex-wrap gap-4">
        <Toggle
          label="featured"
          checked={project.featured}
          onChange={(featured) => update({ featured })}
        />
        <Toggle
          label="visible"
          checked={project.visible}
          onChange={(visible) => update({ visible })}
        />
        <Field label="order">
          <input
            type="number"
            value={project.order}
            onChange={(event) => update({ order: Number(event.target.value) })}
            className="admin-input w-24 px-3 py-2 text-[12px] text-zinc-200"
          />
        </Field>
      </div>
    </div>
  );
}

export function WritingForm({
  item,
  update,
}: {
  item: CmsWritingContent;
  update: (patch: Partial<CmsWritingContent>) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-[1fr_160px]">
        <Field label="title">
          <input
            value={item.title}
            onChange={(event) => update({ title: event.target.value })}
            className="admin-input px-3 py-2 text-[13px] text-zinc-100"
          />
        </Field>
        <Field label="date">
          <input
            value={item.date}
            onChange={(event) => update({ date: event.target.value })}
            className="admin-input px-3 py-2 text-[12px] text-zinc-200"
          />
        </Field>
      </div>
      <Field label="slug">
        <input
          value={item.slug}
          onChange={(event) => update({ slug: event.target.value })}
          className="admin-input px-3 py-2 text-[12px] text-zinc-200"
        />
      </Field>
      <Field label="tags">
        <input
          value={csv(item.tags)}
          onChange={(event) => update({ tags: parseTags(event.target.value) })}
          className="admin-input px-3 py-2 text-[12px] text-zinc-200"
        />
      </Field>
      <Field label="preview">
        <textarea
          value={item.preview}
          onChange={(event) => update({ preview: event.target.value })}
          rows={3}
          className="admin-editor resize-y px-3 py-2 text-[13px] text-zinc-200"
        />
      </Field>
      <Field label="body">
        <textarea
          value={item.body}
          onChange={(event) => update({ body: event.target.value })}
          rows={11}
          className="admin-editor resize-y px-3 py-2 text-[13px] leading-relaxed text-zinc-200"
        />
      </Field>
      <LinkEditor
        links={item.sourceLinks}
        update={(sourceLinks) => update({ sourceLinks })}
      />
      <Toggle
        label="visible"
        checked={item.visible}
        onChange={(visible) => update({ visible })}
      />
    </div>
  );
}

export function NewsletterForm({
  content,
  update,
}: {
  content: NewsletterContent;
  update: (patch: Partial<NewsletterContent>) => void;
}) {
  return (
    <div className="space-y-3">
      <Field label="headline">
        <input
          value={content.headline}
          onChange={(event) => update({ headline: event.target.value })}
          className="admin-input px-3 py-2 text-[13px] text-zinc-100"
        />
      </Field>
      <Field label="deck">
        <textarea
          value={content.deck}
          onChange={(event) => update({ deck: event.target.value })}
          rows={4}
          className="admin-editor resize-y px-3 py-2 text-[13px] text-zinc-200"
        />
      </Field>
      <div className="grid gap-3 md:grid-cols-[1fr_1fr]">
        <Field label="button">
          <input
            value={content.cta_label}
            onChange={(event) => update({ cta_label: event.target.value })}
            className="admin-input px-3 py-2 text-[12px] text-zinc-200"
          />
        </Field>
        <Field label="newsletter url">
          <input
            value={content.buttondown_url}
            onChange={(event) => update({ buttondown_url: event.target.value })}
            className="admin-input px-3 py-2 text-[12px] text-zinc-200"
          />
        </Field>
      </div>
      <div className="grid gap-3 md:grid-cols-[1fr_1fr]">
        <Field label="success message">
          <input
            value={content.success_message}
            onChange={(event) =>
              update({ success_message: event.target.value })
            }
            className="admin-input px-3 py-2 text-[12px] text-zinc-200"
          />
        </Field>
        <Field label="error message">
          <input
            value={content.error_message}
            onChange={(event) => update({ error_message: event.target.value })}
            className="admin-input px-3 py-2 text-[12px] text-zinc-200"
          />
        </Field>
      </div>
      <div className="grid gap-3 md:grid-cols-[1fr_1fr]">
        <Field label="sender">
          <input
            value={content.sender_name}
            onChange={(event) => update({ sender_name: event.target.value })}
            className="admin-input px-3 py-2 text-[12px] text-zinc-200"
          />
        </Field>
      </div>
      <div className="grid gap-3 md:grid-cols-[1fr_1fr]">
        <Field label="sender email">
          <input
            value={content.sender_email}
            onChange={(event) => update({ sender_email: event.target.value })}
            className="admin-input px-3 py-2 text-[12px] text-zinc-200"
          />
        </Field>
        <Field label="reply-to">
          <input
            value={content.reply_to}
            onChange={(event) => update({ reply_to: event.target.value })}
            className="admin-input px-3 py-2 text-[12px] text-zinc-200"
          />
        </Field>
      </div>
      <Field label="footer / legal">
        <textarea
          value={content.footer_text}
          onChange={(event) => update({ footer_text: event.target.value })}
          rows={5}
          className="admin-editor resize-y px-3 py-2 text-[13px] text-zinc-200"
        />
      </Field>
    </div>
  );
}

function LinkEditor({
  links,
  update,
}: {
  links: { label: string; url: string }[];
  update: (links: { label: string; url: string }[]) => void;
}) {
  const rows = links.length ? links : [{ label: "", url: "" }];
  return (
    <div className="space-y-2">
      <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-600">
        links
      </span>
      {rows.map((link, index) => (
        <div key={index} className="grid gap-2 md:grid-cols-[160px_1fr]">
          <input
            value={link.label}
            placeholder="label"
            onChange={(event) => {
              const next = [...rows];
              next[index] = { ...link, label: event.target.value };
              update(next);
            }}
            className="admin-input px-3 py-2 text-[12px] text-zinc-200"
          />
          <input
            value={link.url}
            placeholder="https://..."
            onChange={(event) => {
              const next = [...rows];
              next[index] = { ...link, url: event.target.value };
              update(next);
            }}
            className="admin-input px-3 py-2 text-[12px] text-zinc-200"
          />
        </div>
      ))}
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-[11px] text-zinc-500">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-3 w-3 accent-indigo-500"
      />
      {label}
    </label>
  );
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
