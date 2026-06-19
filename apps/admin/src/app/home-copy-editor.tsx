"use client";

import { useMemo, useState, useTransition } from "react";
import type { HomepageContent, HomepageSection } from "@anipotts/types";
import { ArrowSquareOut, FloppyDisk, Plus, Trash } from "@phosphor-icons/react";
import { saveHomepageContent } from "./actions";

type SectionKey = keyof HomepageContent["sections"];

const FIELD_LIMITS = {
  label: 80,
  heading: 160,
  subheading: 500,
  paragraph: 1200,
  linkLabel: 80,
  linkHref: 300,
  limitMax: 12,
} as const;

interface HomeCopyEditorProps {
  content: HomepageContent;
  source: "cms" | "fallback";
  updatedAt: string | null;
  version: number | null;
}

function cloneContent(content: HomepageContent): HomepageContent {
  return JSON.parse(JSON.stringify(content)) as HomepageContent;
}

function firstLink(section: HomepageSection) {
  return section.links?.[0] ?? { label: "", href: section.view_all ?? "" };
}

function isSafeLink(href: string) {
  if (!href || /[\u0000-\u001f\u007f\s]/.test(href)) return false;
  if (href.startsWith("/")) return !href.startsWith("//");
  if (!href.startsWith("https://")) return false;

  try {
    const parsed = new URL(href);
    return parsed.protocol === "https:" && Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

function validateText(
  value: string,
  label: string,
  maxLength: number,
  required: boolean,
) {
  if (required && !value.trim()) return `${label} is required`;
  if (value.length > maxLength) return `${label} is too long`;
  return null;
}

function validateLink(section: HomepageSection, label: string) {
  if (!section.visible) return null;
  const link = firstLink(section);

  return (
    validateText(
      link.label,
      `${label} link label`,
      FIELD_LIMITS.linkLabel,
      true,
    ) ??
    validateText(link.href, `${label} link`, FIELD_LIMITS.linkHref, true) ??
    (!isSafeLink(link.href)
      ? `${label} link must start with / or https://`
      : null)
  );
}

function validateDraft(content: HomepageContent) {
  const { intro, about, past_work, latest_thoughts } = content.sections;
  const paragraphs = about.paragraphs ?? [];

  return (
    validateText(
      intro.label,
      "Homepage label",
      FIELD_LIMITS.label,
      intro.visible,
    ) ??
    validateText(
      intro.heading,
      "Homepage heading",
      FIELD_LIMITS.heading,
      intro.visible,
    ) ??
    validateText(
      intro.subheading ?? "",
      "Homepage summary",
      FIELD_LIMITS.subheading,
      false,
    ) ??
    validateText(
      about.label,
      "About label",
      FIELD_LIMITS.label,
      about.visible,
    ) ??
    (about.visible &&
    paragraphs.filter((paragraph) => paragraph.trim()).length === 0
      ? "About needs at least one paragraph"
      : null) ??
    (paragraphs.some((paragraph) => paragraph.length > FIELD_LIMITS.paragraph)
      ? "About paragraph is too long"
      : null) ??
    validateText(
      past_work.label,
      "Work label",
      FIELD_LIMITS.label,
      past_work.visible,
    ) ??
    validateLink(past_work, "Work") ??
    validateText(
      latest_thoughts.label,
      "Writing label",
      FIELD_LIMITS.label,
      latest_thoughts.visible,
    ) ??
    validateLink(latest_thoughts, "Writing")
  );
}

function formatTimestamp(value: string | null) {
  if (!value) return "not saved yet";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function HomeCopyEditor({
  content,
  source,
  updatedAt,
  version,
}: HomeCopyEditorProps) {
  const [savedContent, setSavedContent] = useState(() => cloneContent(content));
  const [draft, setDraft] = useState(() => cloneContent(content));
  const [savedUpdatedAt, setSavedUpdatedAt] = useState(updatedAt);
  const [savedVersion, setSavedVersion] = useState(version);
  const [savedSource, setSavedSource] = useState(source);
  const [isPending, startTransition] = useTransition();
  const [dirty, setDirty] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const sections = draft.sections;
  const aboutParagraphs = sections.about.paragraphs ?? [];

  const saveLabel = useMemo(() => {
    if (isPending) return "saving";
    if (dirty) return "save";
    return "saved";
  }, [dirty, isPending]);

  function updateSection(key: SectionKey, patch: Partial<HomepageSection>) {
    setDraft((current) => ({
      ...current,
      sections: {
        ...current.sections,
        [key]: {
          ...current.sections[key],
          ...patch,
        },
      },
    }));
    setDirty(true);
    setFeedback(null);
  }

  function updateSectionLink(
    key: "past_work" | "latest_thoughts",
    patch: { label?: string; href?: string },
  ) {
    const current = firstLink(sections[key]);
    const next = {
      label: patch.label ?? current.label,
      href: patch.href ?? current.href,
    };

    updateSection(key, {
      links: [next],
      view_all: next.href,
    });
  }

  function updateAboutParagraph(index: number, value: string) {
    const next = [...aboutParagraphs];
    next[index] = value;
    updateSection("about", { paragraphs: next });
  }

  function addAboutParagraph() {
    updateSection("about", { paragraphs: [...aboutParagraphs, ""] });
  }

  function removeAboutParagraph(index: number) {
    updateSection("about", {
      paragraphs: aboutParagraphs.filter((_, i) => i !== index),
    });
  }

  function handleSave() {
    const validationError = validateDraft(draft);
    if (validationError) {
      setFeedback(validationError);
      return;
    }

    startTransition(async () => {
      setFeedback(null);
      try {
        const result = await saveHomepageContent(draft);
        if ("error" in result) {
          setFeedback(result.error ?? "save failed");
          return;
        }

        const saved = cloneContent(result.content);
        setSavedContent(saved);
        setDraft(saved);
        setSavedUpdatedAt(result.updatedAt);
        setSavedVersion(result.version);
        setSavedSource("cms");
        setDirty(false);
        setFeedback(`saved v${result.version}`);
      } catch (error) {
        setFeedback(`save failed: ${String(error)}`);
      }
    });
  }

  function handleReset() {
    setDraft(cloneContent(savedContent));
    setDirty(false);
    setFeedback(null);
  }

  return (
    <section className="rounded-lg border border-zinc-800/60 bg-zinc-950/50">
      <div className="border-b border-zinc-800/50 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[13px] font-medium text-zinc-100">Site copy</h2>
          <p className="mt-1 text-[11px] text-zinc-600">
            {savedSource === "cms"
              ? `cms v${savedVersion ?? 1}`
              : "fallback copy"}{" "}
            / {formatTimestamp(savedUpdatedAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="https://preview.anipotts.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-800 px-2.5 py-1.5 text-[11px] text-zinc-500 transition-colors hover:border-zinc-700 hover:text-zinc-300"
          >
            <ArrowSquareOut size={13} />
            preview
          </a>
          <button
            type="button"
            onClick={handleReset}
            disabled={!dirty || isPending}
            className="rounded-md border border-zinc-800 px-2.5 py-1.5 text-[11px] text-zinc-500 transition-colors hover:border-zinc-700 hover:text-zinc-300 disabled:opacity-30"
          >
            reset
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!dirty || isPending}
            className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-30"
          >
            <FloppyDisk size={13} weight="duotone" />
            {saveLabel}
          </button>
        </div>
      </div>

      {feedback && (
        <div
          role="status"
          className={`border-b border-zinc-800/40 px-4 py-2 text-[11px] ${
            feedback.startsWith("saved") ? "text-green-400" : "text-red-400"
          }`}
        >
          {feedback}
        </div>
      )}

      <div className="grid gap-4 p-4 xl:grid-cols-[1.2fr_1fr]">
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

        <div className="space-y-3">
          <SectionControls
            title="selected work"
            section={sections.past_work}
            onVisibleChange={(visible) =>
              updateSection("past_work", { visible })
            }
            onLabelChange={(label) => updateSection("past_work", { label })}
            onLimitChange={(limit) => updateSection("past_work", { limit })}
            onLinkChange={(patch) => updateSectionLink("past_work", patch)}
          />
          <SectionControls
            title="latest writing"
            section={sections.latest_thoughts}
            onVisibleChange={(visible) =>
              updateSection("latest_thoughts", { visible })
            }
            onLabelChange={(label) =>
              updateSection("latest_thoughts", { label })
            }
            onLimitChange={(limit) =>
              updateSection("latest_thoughts", { limit })
            }
            onLinkChange={(patch) =>
              updateSectionLink("latest_thoughts", patch)
            }
          />
        </div>
      </div>
    </section>
  );
}

function SectionControls({
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
  onLinkChange: (patch: { label?: string; href?: string }) => void;
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
