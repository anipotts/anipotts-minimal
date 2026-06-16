import { describe, expect, it } from "vitest";
import {
  DEFAULT_HOMEPAGE_CONTENT,
  DEFAULT_NEWSLETTER_CONTENT,
  normalizeCmsProject,
  normalizeCmsWriting,
  normalizeHomepageContent,
  normalizeNewsletterContent,
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
      error: "Thoughts link must start with / or https://",
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

describe("owner editor cms validation", () => {
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
