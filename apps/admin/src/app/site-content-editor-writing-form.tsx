"use client";

import type { CmsWritingContent } from "@anipotts/types";
import {
  Field,
  LinkEditor,
  Toggle,
  csv,
  parseTags,
} from "./site-content-editor-fields";

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
