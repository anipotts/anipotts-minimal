import { describe, expect, it } from "vitest";
import {
  DEFAULT_HOMEPAGE_CONTENT,
  normalizeHomepageContent,
  validateHomepageContent,
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
