"use client";

import { useMemo, useState, useTransition } from "react";
import type {
  CmsProjectContent,
  CmsWritingContent,
  NewsletterContent,
} from "@anipotts/types";
import {
  saveNewsletterContent,
  saveProjectContent,
  saveWritingContent,
} from "./actions";
import {
  buildEditorItems,
  clone,
  getInitialEditorSelection,
  projectKey,
  validateEditorContent,
  writingKey,
  type EditorKind,
  type SiteContentEditorProps,
} from "./site-content-editor-model";
import {
  NewsletterForm,
  PreviewPanel,
  ProjectForm,
  WritingForm,
} from "./site-content-editor-panels";
import {
  SiteContentEditorFeedback,
  SiteContentEditorHeader,
  SiteContentEditorSidebar,
} from "./site-content-editor-shell";

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
    return getInitialEditorSelection(initialProjects, initialWriting);
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

  const items = useMemo(
    () =>
      buildEditorItems({
        projects,
        writing,
        newsletterSource: newsletterMeta.source,
        newsletterVersion,
        query,
      }),
    [newsletterMeta.source, newsletterVersion, projects, query, writing],
  );

  const activeProject =
    active.kind === "project"
      ? (projects.find((project) => projectKey(project) === active.id) ?? null)
      : null;
  const activeWriting =
    active.kind === "writing"
      ? (writing.find((item) => writingKey(item) === active.id) ?? null)
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
    return validateEditorContent({
      active,
      project: activeProject,
      writing: activeWriting,
      newsletter,
    });
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
      <SiteContentEditorHeader
        projectCount={projects.length}
        writingCount={writing.length}
        dirty={dirty}
        isPending={isPending}
        onReset={handleReset}
        onSave={handleSave}
      />

      <SiteContentEditorFeedback feedback={feedback} />

      <div className="grid min-h-[620px] lg:grid-cols-[300px_1fr]">
        <SiteContentEditorSidebar
          active={active}
          items={items}
          query={query}
          onQueryChange={setQuery}
          onSelect={(selection) => {
            setActive(selection);
            setDirty(false);
            setFeedback(null);
          }}
        />

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
