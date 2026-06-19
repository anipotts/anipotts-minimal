"use client";

import { useMemo, useState, useTransition } from "react";
import type { HomepageContent, HomepageSection } from "@anipotts/types";
import { ArrowSquareOut, FloppyDisk } from "@phosphor-icons/react";
import { saveHomepageContent } from "./actions";
import { IntroAboutFields, SectionControls } from "./home-copy-editor-panels";
import {
  cloneContent,
  firstLink,
  formatTimestamp,
  validateDraft,
  type SectionKey,
} from "./home-copy-editor-model";

interface HomeCopyEditorProps {
  content: HomepageContent;
  source: "cms" | "fallback";
  updatedAt: string | null;
  version: number | null;
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
        <IntroAboutFields
          sections={sections}
          aboutParagraphs={aboutParagraphs}
          updateSection={updateSection}
          updateAboutParagraph={updateAboutParagraph}
          addAboutParagraph={addAboutParagraph}
          removeAboutParagraph={removeAboutParagraph}
        />

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
