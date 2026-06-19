"use client";

import { useMemo, useState, useTransition } from "react";
import type {
  CmsProjectContent,
  CmsWritingContent,
  NewsletterContent,
} from "@anipotts/types";
import { FloppyDisk, MagnifyingGlass } from "@phosphor-icons/react";
import {
  saveNewsletterContent,
  saveProjectContent,
  saveWritingContent,
} from "./actions";
import {
  NewsletterForm,
  PreviewPanel,
  ProjectForm,
  WritingForm,
} from "./site-content-editor-panels";

type EditorKind = "project" | "writing" | "newsletter";
type EditorItem =
  | { kind: "project"; id: string; label: string; meta: string }
  | { kind: "writing"; id: string; label: string; meta: string }
  | { kind: "newsletter"; id: "newsletter"; label: string; meta: string };

interface SiteContentEditorProps {
  projects: CmsProjectContent[];
  writing: CmsWritingContent[];
  newsletter: NewsletterContent;
  newsletterMeta: {
    source: "cms" | "d1" | "fallback";
    updated_at: string | null;
    version: number | null;
  };
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function projectKey(project: CmsProjectContent) {
  return project.id ?? project.slug;
}

function writingKey(item: CmsWritingContent) {
  return item.id ?? item.slug;
}

export default function SiteContentEditor({
  projects: initialProjects,
  writing: initialWriting,
  newsletter: initialNewsletter,
  newsletterMeta,
}: SiteContentEditorProps) {
  const [projects, setProjects] = useState(() => clone(initialProjects));
  const [writing, setWriting] = useState(() => clone(initialWriting));
  const [savedNewsletter, setSavedNewsletter] = useState(() =>
    clone(initialNewsletter),
  );
  const [newsletter, setNewsletter] = useState(() => clone(initialNewsletter));
  const [active, setActive] = useState<{ kind: EditorKind; id: string }>(() => {
    const firstProject = initialProjects[0];
    if (firstProject) return { kind: "project", id: projectKey(firstProject) };
    const firstWriting = initialWriting[0];
    if (firstWriting) return { kind: "writing", id: writingKey(firstWriting) };
    return { kind: "newsletter", id: "newsletter" };
  });
  const [query, setQuery] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [newsletterSavedAt, setNewsletterSavedAt] = useState(
    newsletterMeta.updated_at,
  );
  const [newsletterVersion, setNewsletterVersion] = useState(
    newsletterMeta.version,
  );
  const [isPending, startTransition] = useTransition();

  const items = useMemo<EditorItem[]>(() => {
    const all: EditorItem[] = [
      ...projects.map((project) => ({
        kind: "project" as const,
        id: projectKey(project),
        label: project.title || project.slug,
        meta: `${project.visible ? "visible" : "hidden"} / ${project.status}`,
      })),
      ...writing.map((item) => ({
        kind: "writing" as const,
        id: writingKey(item),
        label: item.title || item.slug,
        meta: `${item.visible ? "published" : "draft"} / ${item.date || "undated"}`,
      })),
      {
        kind: "newsletter",
        id: "newsletter",
        label: "newsletter copy",
        meta:
          newsletterMeta.source === "cms"
            ? `cms v${newsletterVersion ?? 1}`
            : "fallback",
      },
    ];
    const needle = query.trim().toLowerCase();
    if (!needle) return all;
    return all.filter(
      (item) =>
        item.label.toLowerCase().includes(needle) ||
        item.meta.toLowerCase().includes(needle) ||
        item.kind.includes(needle),
    );
  }, [newsletterMeta.source, newsletterVersion, projects, query, writing]);

  const activeProject =
    active.kind === "project"
      ? projects.find((project) => projectKey(project) === active.id)
      : null;
  const activeWriting =
    active.kind === "writing"
      ? writing.find((item) => writingKey(item) === active.id)
      : null;

  function markDirty() {
    setDirty(true);
    setFeedback(null);
  }

  function updateProject(patch: Partial<CmsProjectContent>) {
    setProjects((current) =>
      current.map((project) =>
        projectKey(project) === active.id ? { ...project, ...patch } : project,
      ),
    );
    markDirty();
  }

  function updateWriting(patch: Partial<CmsWritingContent>) {
    setWriting((current) =>
      current.map((item) =>
        writingKey(item) === active.id ? { ...item, ...patch } : item,
      ),
    );
    markDirty();
  }

  function updateNewsletter(patch: Partial<NewsletterContent>) {
    setNewsletter((current) => ({ ...current, ...patch }));
    markDirty();
  }

  function validateActive() {
    if (activeProject) {
      if (!activeProject.title.trim()) return "Project title is required";
      if (!activeProject.summary.trim()) return "Project summary is required";
      if (!activeProject.body.trim()) return "Project body is required";
    }
    if (activeWriting) {
      if (!activeWriting.title.trim()) return "Writing title is required";
      if (!activeWriting.preview.trim()) return "Writing preview is required";
      if (!activeWriting.body.trim()) return "Writing body is required";
    }
    if (active.kind === "newsletter") {
      if (!newsletter.headline.trim()) return "Newsletter headline is required";
      if (!newsletter.deck.trim()) return "Newsletter deck is required";
    }
    return null;
  }

  function handleSave() {
    const localError = validateActive();
    if (localError) {
      setFeedback(localError);
      return;
    }

    startTransition(async () => {
      setFeedback(null);
      try {
        if (activeProject) {
          const result = await saveProjectContent(activeProject);
          if ("error" in result) {
            setFeedback(result.error ?? "save failed");
            return;
          }
          setProjects((current) =>
            current.map((project) =>
              projectKey(project) === active.id ? result.project : project,
            ),
          );
          setActive({
            kind: "project",
            id: result.project.id ?? result.project.slug,
          });
          setDirty(false);
          setFeedback("saved project");
          return;
        }

        if (activeWriting) {
          const result = await saveWritingContent(activeWriting);
          if ("error" in result) {
            setFeedback(result.error ?? "save failed");
            return;
          }
          setWriting((current) =>
            current.map((item) =>
              writingKey(item) === active.id ? result.writing : item,
            ),
          );
          setActive({
            kind: "writing",
            id: result.writing.id ?? result.writing.slug,
          });
          setDirty(false);
          setFeedback("saved writing");
          return;
        }

        const result = await saveNewsletterContent(newsletter);
        if ("error" in result) {
          setFeedback(result.error);
          return;
        }
        setNewsletter(result.content);
        setSavedNewsletter(result.content);
        setNewsletterSavedAt(result.updatedAt);
        setNewsletterVersion(result.version);
        setDirty(false);
        setFeedback(`saved newsletter v${result.version}`);
      } catch (error) {
        setFeedback(`save failed: ${String(error)}`);
      }
    });
  }

  function handleReset() {
    if (active.kind === "newsletter") {
      setNewsletter(clone(savedNewsletter));
    } else {
      setProjects(clone(initialProjects));
      setWriting(clone(initialWriting));
    }
    setDirty(false);
    setFeedback(null);
  }

  return (
    <section className="rounded-lg border border-zinc-800/60 bg-zinc-950/50">
      <div className="border-b border-zinc-800/50 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[13px] font-medium text-zinc-100">
            Content inventory
          </h2>
          <p className="mt-1 text-[11px] text-zinc-600">
            {projects.length} projects / {writing.length} writing entries /
            newsletter slots
          </p>
        </div>
        <div className="flex items-center gap-2">
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
            {isPending ? "saving" : dirty ? "save" : "saved"}
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

      <div className="grid min-h-[620px] lg:grid-cols-[300px_1fr]">
        <aside className="border-b border-zinc-800/50 lg:border-b-0 lg:border-r">
          <label className="relative block border-b border-zinc-800/50 p-3">
            <MagnifyingGlass
              size={14}
              className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="search content"
              className="admin-input w-full px-8 py-2 text-[12px] text-zinc-200"
            />
          </label>
          <div className="max-h-[520px] overflow-y-auto admin-scroll">
            {items.map((item) => {
              const selected =
                item.kind === active.kind && item.id === active.id;
              return (
                <button
                  key={`${item.kind}:${item.id}`}
                  type="button"
                  onClick={() => {
                    setActive({ kind: item.kind, id: item.id });
                    setDirty(false);
                    setFeedback(null);
                  }}
                  className={`block w-full border-b border-zinc-900 px-3 py-2.5 text-left transition-colors ${
                    selected ? "bg-zinc-900/80" : "hover:bg-zinc-900/50"
                  }`}
                >
                  <span className="block truncate text-[12px] text-zinc-200">
                    {item.label}
                  </span>
                  <span className="mt-0.5 block text-[10px] uppercase tracking-wide text-zinc-600">
                    {item.kind} / {item.meta}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="grid gap-4 p-4 xl:grid-cols-[1fr_0.8fr]">
          <div>
            {activeProject && (
              <ProjectForm project={activeProject} update={updateProject} />
            )}
            {activeWriting && (
              <WritingForm item={activeWriting} update={updateWriting} />
            )}
            {active.kind === "newsletter" && (
              <NewsletterForm content={newsletter} update={updateNewsletter} />
            )}
          </div>

          <PreviewPanel
            project={activeProject ?? null}
            writing={activeWriting ?? null}
            newsletter={active.kind === "newsletter" ? newsletter : null}
            newsletterSavedAt={newsletterSavedAt}
          />
        </div>
      </div>
    </section>
  );
}
