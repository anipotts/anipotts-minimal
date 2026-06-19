import type { HomepageContent, HomepageSection } from "@anipotts/types";
import {
  DEFAULT_HOMEPAGE_CONTENT,
  HOMEPAGE_FIELD_LIMITS,
  HOME_SECTION_ORDER,
} from "./defaults";

function coerceString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function coerceBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  return fallback;
}

function coercePositiveInteger(value: unknown, fallback: number): number {
  if (typeof value !== "number" || !Number.isInteger(value)) return fallback;
  return Math.min(
    HOMEPAGE_FIELD_LIMITS.limitMax,
    Math.max(HOMEPAGE_FIELD_LIMITS.limitMin, value),
  );
}

function normalizeSection(
  section: unknown,
  fallback: HomepageSection,
): HomepageSection {
  const source =
    section && typeof section === "object"
      ? (section as Record<string, unknown>)
      : {};

  const normalized: HomepageSection = {
    visible: coerceBoolean(source.visible, fallback.visible),
    label: coerceString(source.label, fallback.label).trim(),
    heading: coerceString(source.heading, fallback.heading).trim(),
  };

  if (source.subheading !== undefined || fallback.subheading !== undefined) {
    normalized.subheading =
      source.subheading === undefined
        ? fallback.subheading
        : coerceString(source.subheading, fallback.subheading ?? "").trim();
  }

  if (Array.isArray(source.paragraphs)) {
    normalized.paragraphs = source.paragraphs
      .filter((paragraph): paragraph is string => typeof paragraph === "string")
      .map((paragraph) => paragraph.trim());
  } else if (fallback.paragraphs !== undefined) {
    normalized.paragraphs = fallback.paragraphs;
  }

  if (Array.isArray(source.links)) {
    normalized.links = source.links
      .filter(
        (
          link,
        ): link is {
          label: string;
          href: string;
        } =>
          Boolean(link) &&
          typeof link === "object" &&
          typeof (link as Record<string, unknown>).label === "string" &&
          typeof (link as Record<string, unknown>).href === "string",
      )
      .map((link) => ({
        label: link.label.trim(),
        href: link.href.trim(),
      }));
  } else if (fallback.links !== undefined) {
    normalized.links = fallback.links;
  }

  if (source.limit !== undefined || fallback.limit !== undefined) {
    normalized.limit = coercePositiveInteger(source.limit, fallback.limit ?? 1);
  }

  if (source.view_all !== undefined || fallback.view_all !== undefined) {
    normalized.view_all =
      source.view_all === undefined
        ? fallback.view_all
        : coerceString(source.view_all, fallback.view_all ?? "");
  }

  return normalized;
}

function isSafeHomepageLink(href: string): boolean {
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

function validateTextField(
  value: string,
  label: string,
  maxLength: number,
  required: boolean,
): string | null {
  if (required && !value.trim()) return `${label} is required`;
  if (value.length > maxLength) return `${label} is too long`;
  return null;
}

function validateSectionLabel(section: HomepageSection, label: string) {
  return validateTextField(
    section.label,
    label,
    HOMEPAGE_FIELD_LIMITS.label,
    section.visible,
  );
}

function validateSectionLink(section: HomepageSection, label: string) {
  const link = section.links?.[0];
  if (!section.visible) return null;
  if (!link) return `${label} link is required`;

  return (
    validateTextField(
      link.label,
      `${label} link label`,
      HOMEPAGE_FIELD_LIMITS.linkLabel,
      true,
    ) ??
    validateTextField(
      link.href,
      `${label} link`,
      HOMEPAGE_FIELD_LIMITS.linkHref,
      true,
    ) ??
    (!isSafeHomepageLink(link.href)
      ? `${label} link must start with / or https://`
      : null)
  );
}

export function validateHomepageContent(content: HomepageContent): {
  ok: boolean;
  error?: string;
} {
  const { intro, about, past_work, latest_thoughts } = content.sections;

  const introError =
    validateSectionLabel(intro, "Homepage label") ??
    validateTextField(
      intro.heading,
      "Homepage heading",
      HOMEPAGE_FIELD_LIMITS.heading,
      intro.visible,
    ) ??
    validateTextField(
      intro.subheading ?? "",
      "Homepage summary",
      HOMEPAGE_FIELD_LIMITS.subheading,
      false,
    );
  if (introError) return { ok: false, error: introError };

  const aboutError = validateSectionLabel(about, "About label");
  if (aboutError) return { ok: false, error: aboutError };

  const paragraphs = about.paragraphs ?? [];
  if (about.visible && paragraphs.filter(Boolean).length === 0) {
    return { ok: false, error: "About needs at least one paragraph" };
  }
  const longParagraph = paragraphs.find(
    (paragraph) => paragraph.length > HOMEPAGE_FIELD_LIMITS.paragraph,
  );
  if (longParagraph) {
    return { ok: false, error: "About paragraph is too long" };
  }

  const workError =
    validateSectionLabel(past_work, "Work label") ??
    validateSectionLink(past_work, "Work");
  if (workError) return { ok: false, error: workError };

  const writingError =
    validateSectionLabel(latest_thoughts, "Writing label") ??
    validateSectionLink(latest_thoughts, "Writing");
  if (writingError) return { ok: false, error: writingError };

  return { ok: true };
}

export function normalizeHomepageContent(content: unknown): HomepageContent {
  const source =
    content && typeof content === "object"
      ? (content as Partial<HomepageContent>)
      : {};

  return {
    sections: {
      intro: normalizeSection(
        source.sections?.intro,
        DEFAULT_HOMEPAGE_CONTENT.sections.intro,
      ),
      about: normalizeSection(
        source.sections?.about,
        DEFAULT_HOMEPAGE_CONTENT.sections.about,
      ),
      past_work: normalizeSection(
        source.sections?.past_work,
        DEFAULT_HOMEPAGE_CONTENT.sections.past_work,
      ),
      latest_thoughts: normalizeSection(
        source.sections?.latest_thoughts,
        DEFAULT_HOMEPAGE_CONTENT.sections.latest_thoughts,
      ),
    },
    section_order: HOME_SECTION_ORDER,
  };
}
