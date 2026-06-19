"use client";

import type { CmsProjectContent } from "@anipotts/types";
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
