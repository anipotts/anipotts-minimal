"use client";

import type {
  CmsProjectContent,
  CmsWritingContent,
  NewsletterContent,
} from "@anipotts/types";
import {
  Field,
  LinkEditor,
  Toggle,
  csv,
  parseTags,
} from "./site-content-editor-fields";

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
