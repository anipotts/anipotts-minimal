"use client";

import type { HomepageContent, HomepageSection } from "@anipotts/types";
import { Plus, Trash } from "@phosphor-icons/react";
import {
  FIELD_LIMITS,
  firstLink,
  type SectionKey,
} from "./home-copy-editor-model";

type LinkPatch = { label?: string; href?: string };

export function IntroAboutFields({
  sections,
  aboutParagraphs,
  updateSection,
  updateAboutParagraph,
  addAboutParagraph,
  removeAboutParagraph,
}: {
  sections: HomepageContent["sections"];
  aboutParagraphs: string[];
  updateSection: (key: SectionKey, patch: Partial<HomepageSection>) => void;
  updateAboutParagraph: (index: number, value: string) => void;
  addAboutParagraph: () => void;
  removeAboutParagraph: (index: number) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-[120px_1fr]">
        <label className="text-[11px] font-medium uppercase tracking-wide text-zinc-600">
          label
        </label>
        <input
          value={sections.intro.label}
          maxLength={FIELD_LIMITS.label}
          onChange={(event) =>
            updateSection("intro", { label: event.target.value })
          }
          required={sections.intro.visible}
          className="admin-input px-3 py-2 text-[12px] text-zinc-200"
        />
      </div>
      <div className="grid gap-3 md:grid-cols-[120px_1fr]">
        <label className="text-[11px] font-medium uppercase tracking-wide text-zinc-600">
          heading
        </label>
        <input
          value={sections.intro.heading}
          maxLength={FIELD_LIMITS.heading}
          onChange={(event) =>
            updateSection("intro", { heading: event.target.value })
          }
          required={sections.intro.visible}
          className="admin-input px-3 py-2 text-[18px] font-semibold text-zinc-100"
        />
      </div>
      <div className="grid gap-3 md:grid-cols-[120px_1fr]">
        <label className="text-[11px] font-medium uppercase tracking-wide text-zinc-600">
          summary
        </label>
        <textarea
          value={sections.intro.subheading ?? ""}
          maxLength={FIELD_LIMITS.subheading}
          onChange={(event) =>
            updateSection("intro", { subheading: event.target.value })
          }
          rows={3}
          className="admin-editor resize-none px-3 py-2 text-[13px] leading-relaxed text-zinc-200"
        />
      </div>

      <div className="grid gap-3 md:grid-cols-[120px_1fr]">
        <label className="text-[11px] font-medium uppercase tracking-wide text-zinc-600">
          about
        </label>
        <div className="space-y-2">
          <input
            value={sections.about.label}
            maxLength={FIELD_LIMITS.label}
            onChange={(event) =>
              updateSection("about", { label: event.target.value })
            }
            required={sections.about.visible}
            className="admin-input w-full px-3 py-2 text-[12px] text-zinc-200"
          />
          {aboutParagraphs.map((paragraph, index) => (
            <div key={index} className="flex gap-2">
              <textarea
                value={paragraph}
                maxLength={FIELD_LIMITS.paragraph}
                onChange={(event) =>
                  updateAboutParagraph(index, event.target.value)
                }
                rows={4}
                className="admin-editor min-h-24 flex-1 resize-y px-3 py-2 text-[13px] leading-relaxed text-zinc-200"
              />
              <button
                type="button"
                onClick={() => removeAboutParagraph(index)}
                className="h-9 rounded-md border border-zinc-800 px-2 text-zinc-600 transition-colors hover:border-zinc-700 hover:text-zinc-300"
                aria-label="remove paragraph"
              >
                <Trash size={14} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addAboutParagraph}
            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-800 px-2.5 py-1.5 text-[11px] text-zinc-500 transition-colors hover:border-zinc-700 hover:text-zinc-300"
          >
            <Plus size={13} />
            paragraph
          </button>
        </div>
      </div>
    </div>
  );
}

export function SectionControls({
  title,
  section,
  onVisibleChange,
  onLabelChange,
  onLimitChange,
  onLinkChange,
}: {
  title: string;
  section: HomepageSection;
  onVisibleChange: (visible: boolean) => void;
  onLabelChange: (label: string) => void;
  onLimitChange: (limit: number) => void;
  onLinkChange: (patch: LinkPatch) => void;
}) {
  const link = firstLink(section);

  return (
    <div
      className={`rounded-md border border-zinc-800/60 bg-zinc-950/40 p-3 ${
        section.visible ? "" : "opacity-70"
      }`}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
          {title}
        </h3>
        <label className="flex items-center gap-2 text-[11px] text-zinc-500">
          <input
            type="checkbox"
            checked={section.visible}
            onChange={(event) => onVisibleChange(event.target.checked)}
            className="h-3 w-3 accent-indigo-500"
          />
          visible
        </label>
      </div>
      <div className="space-y-2">
        <input
          value={section.label}
          maxLength={FIELD_LIMITS.label}
          required={section.visible}
          onChange={(event) => onLabelChange(event.target.value)}
          className="admin-input w-full px-3 py-2 text-[12px] text-zinc-200"
        />
        <div className="grid grid-cols-[1fr_72px] gap-2">
          <input
            value={link.label}
            disabled={!section.visible}
            maxLength={FIELD_LIMITS.linkLabel}
            required={section.visible}
            onChange={(event) => onLinkChange({ label: event.target.value })}
            className="admin-input px-3 py-2 text-[12px] text-zinc-200"
          />
          <input
            type="number"
            min={1}
            max={FIELD_LIMITS.limitMax}
            value={section.limit ?? 1}
            onChange={(event) =>
              onLimitChange(
                Math.min(
                  FIELD_LIMITS.limitMax,
                  Math.max(1, Number(event.target.value) || 1),
                ),
              )
            }
            disabled={!section.visible}
            className="admin-input px-3 py-2 text-[12px] text-zinc-200"
            aria-label={`${title} limit`}
          />
        </div>
        <input
          value={link.href}
          disabled={!section.visible}
          maxLength={FIELD_LIMITS.linkHref}
          required={section.visible}
          onChange={(event) => onLinkChange({ href: event.target.value })}
          className="admin-input w-full px-3 py-2 text-[12px] text-zinc-200"
        />
      </div>
    </div>
  );
}
