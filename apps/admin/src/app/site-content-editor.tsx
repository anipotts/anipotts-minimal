"use client";

import { useMemo, useState, useTransition } from "react";
import type {
  CmsProjectContent,
  CmsWritingContent,
  NewsletterContent,
} from "@anipotts/types";
import {
  ArrowSquareOut,
  FloppyDisk,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import {
  saveNewsletterContent,
  saveProjectContent,
  saveWritingContent,
} from "./actions";

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

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-600">
        {label}
      </span>
      {children}
    </label>
  );
}

function ProjectForm({
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

function WritingForm({
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

function NewsletterForm({
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

function PreviewPanel({
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
