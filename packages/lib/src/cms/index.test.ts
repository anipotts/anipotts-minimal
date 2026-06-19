import { describe, expect, it } from "vitest";
import { setDB, type D1Database, type D1PreparedStatement } from "../db";
import {
  cmsProjectPageKey,
  cmsWritingPageKey,
  DEFAULT_CMS_PROJECTS,
  DEFAULT_CMS_WRITING,
  DEFAULT_HOMEPAGE_CONTENT,
  DEFAULT_NEWSLETTER_CONTENT,
  normalizeCmsProject,
  normalizeCmsWriting,
  normalizeHomepageContent,
  normalizeNewsletterContent,
  searchWriting,
  validateCmsProject,
  validateCmsWriting,
  validateHomepageContent,
  validateNewsletterContent,
} from "./index";

describe("homepage cms validation", () => {
  it("accepts normalized fallback content", () => {
    const content = normalizeHomepageContent(DEFAULT_HOMEPAGE_CONTENT);
    expect(validateHomepageContent(content)).toEqual({ ok: true });
  });

  it("rejects empty visible required fields", () => {
    const content = normalizeHomepageContent({
      ...DEFAULT_HOMEPAGE_CONTENT,
      sections: {
        ...DEFAULT_HOMEPAGE_CONTENT.sections,
        intro: {
          ...DEFAULT_HOMEPAGE_CONTENT.sections.intro,
          heading: "",
        },
      },
    });

    expect(validateHomepageContent(content)).toEqual({
      ok: false,
      error: "Homepage heading is required",
    });
  });

  it("allows hidden sections to have empty labels and links", () => {
    const content = normalizeHomepageContent({
      ...DEFAULT_HOMEPAGE_CONTENT,
      sections: {
        ...DEFAULT_HOMEPAGE_CONTENT.sections,
        past_work: {
          ...DEFAULT_HOMEPAGE_CONTENT.sections.past_work,
          visible: false,
          label: "",
          links: [{ label: "", href: "" }],
        },
      },
    });

    expect(validateHomepageContent(content)).toEqual({ ok: true });
  });

  it("rejects malformed visible links", () => {
    const content = normalizeHomepageContent({
      ...DEFAULT_HOMEPAGE_CONTENT,
      sections: {
        ...DEFAULT_HOMEPAGE_CONTENT.sections,
        latest_thoughts: {
          ...DEFAULT_HOMEPAGE_CONTENT.sections.latest_thoughts,
          links: [{ label: "news", href: "javascript:alert(1)" }],
        },
      },
    });

    expect(validateHomepageContent(content)).toEqual({
      ok: false,
      error: "Writing link must start with / or https://",
    });
  });

  it("rejects excessive paragraph length", () => {
    const content = normalizeHomepageContent({
      ...DEFAULT_HOMEPAGE_CONTENT,
      sections: {
        ...DEFAULT_HOMEPAGE_CONTENT.sections,
        about: {
          ...DEFAULT_HOMEPAGE_CONTENT.sections.about,
          paragraphs: ["x".repeat(1201)],
        },
      },
    });

    expect(validateHomepageContent(content)).toEqual({
      ok: false,
      error: "About paragraph is too long",
    });
  });
});

describe("writing search", () => {
  it("uses safe fts phrase matching against published writing rows", async () => {
    let preparedSql = "";
    let boundValues: unknown[] = [];

    const statement: D1PreparedStatement = {
      bind(...values: unknown[]) {
        boundValues = values;
        return statement;
      },
      async first() {
        return null;
      },
      async run() {
        return {
          results: [],
          success: true,
          meta: {
            duration: 0,
            changes: 0,
            last_row_id: 0,
            rows_read: 0,
            rows_written: 0,
          },
        };
      },
      async all<T>() {
        return {
          results: [
            {
              slug: "claude-code",
              title: "claude code",
              summary: "agent note",
              created_at: "2026-06-01",
              published_at: "2026-06-16",
              views: 5,
              id: "thought-1",
              series_type: "note",
              tags: '["codex"]',
            },
          ] as T[],
          success: true,
          meta: {
            duration: 0,
            changes: 0,
            last_row_id: 0,
            rows_read: 1,
            rows_written: 0,
          },
        };
      },
      async raw<T>() {
        return [] as T[];
      },
    };

    const db: D1Database = {
      prepare(query: string) {
        preparedSql = query;
        return statement;
      },
      async exec() {
        return {
          results: [],
          success: true,
          meta: {
            duration: 0,
            changes: 0,
            last_row_id: 0,
            rows_read: 0,
            rows_written: 0,
          },
        };
      },
      async batch() {
        return [];
      },
      async dump() {
        return new ArrayBuffer(0);
      },
    };

    setDB(db);

    const results = await searchWriting('claude "code"');

    expect(preparedSql).toContain("t.published_at");
    expect(preparedSql).toContain(
      "AND (t.status = 'published' OR t.published = 1)",
    );
    expect(boundValues).toEqual(['"claude ""code"""']);
    expect(results[0]).toMatchObject({
      slug: "claude-code",
      published_at: "2026-06-16",
      tags: ["codex"],
    });
  });
});

describe("owner editor cms validation", () => {
  it("keeps page-content keys and fallback inventory stable", () => {
    expect(cmsProjectPageKey("Claude Code Tips!")).toBe(
      "project:claude-code-tips",
    );
    expect(cmsWritingPageKey('Stop Ending Your Day With "Fix The Bug"')).toBe(
      "writing:stop-ending-your-day-with-fix-the-bug",
    );
    expect(DEFAULT_CMS_PROJECTS.length).toBeGreaterThan(0);
    expect(DEFAULT_CMS_WRITING.length).toBeGreaterThan(0);
  });

  it("normalizes project editor content from d1-shaped rows", () => {
    const project = normalizeCmsProject({
      slug: "My Project!",
      title: " my project ",
      status: "in-progress",
      year: "2026",
      duration: "spring 2026",
      tags: '["ai","tools"]',
      subtitle: " summary ",
      description: "body",
      link_live: "https://example.com",
      featured: 1,
      visible: 1,
      sort_order: 10,
    });

    expect(project).toMatchObject({
      slug: "my-project",
      status: "wip",
      summary: "summary",
      tags: ["ai", "tools"],
      featured: true,
      visible: true,
      order: 10,
    });
    expect(validateCmsProject(project)).toEqual({ ok: true });
  });

  it("rejects bad project links", () => {
    const project = normalizeCmsProject({
      slug: "project",
      title: "project",
      status: "live",
      year: "2026",
      range: "ongoing",
      summary: "summary",
      body: "body",
      links: [{ label: "demo", url: "javascript:alert(1)" }],
    });

    expect(validateCmsProject(project)).toEqual({
      ok: false,
      error: "Project link must start with /, https://, or mailto:",
    });
  });

  it("normalizes writing visibility from published status", () => {
    const writing = normalizeCmsWriting({
      slug: "Post",
      title: "post",
      summary: "preview",
      content: "body",
      status: "published",
      published_at: "2026-06-16",
      tags: ["codex"],
      artifact_url: "https://example.com/source",
      artifact_type: "source",
    });

    expect(writing.visible).toBe(true);
    expect(writing.date).toBe("2026-06-16");
    expect(validateCmsWriting(writing)).toEqual({ ok: true });
  });

  it("rejects empty writing body", () => {
    const writing = normalizeCmsWriting({
      slug: "post",
      title: "post",
      preview: "preview",
      body: "",
      date: "2026-06-16",
    });

    expect(validateCmsWriting(writing)).toEqual({
      ok: false,
      error: "Writing body is required",
    });
  });

  it("validates newsletter sender slots", () => {
    const newsletter = normalizeNewsletterContent({
      ...DEFAULT_NEWSLETTER_CONTENT,
      sender_email: "bad",
    });

    expect(validateNewsletterContent(newsletter)).toEqual({
      ok: false,
      error: "Sender email is invalid",
    });
  });
});
