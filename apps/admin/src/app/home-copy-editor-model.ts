import type { HomepageContent, HomepageSection } from "@anipotts/types";

export type SectionKey = keyof HomepageContent["sections"];

export const FIELD_LIMITS = {
  label: 80,
  heading: 160,
  subheading: 500,
  paragraph: 1200,
  linkLabel: 80,
  linkHref: 300,
  limitMax: 12,
} as const;

export function cloneContent(content: HomepageContent): HomepageContent {
  return JSON.parse(JSON.stringify(content)) as HomepageContent;
}

export function firstLink(section: HomepageSection) {
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

export function validateDraft(content: HomepageContent) {
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

export function formatTimestamp(value: string | null) {
  if (!value) return "not saved yet";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
