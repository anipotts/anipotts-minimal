import type {
  CmsEditorLink,
  CmsProjectContent,
  CmsWritingContent,
  ListingPageContent,
  NewsletterContent,
} from "@anipotts/types";
import { parseJsonArray } from "../db";
import {
  CMS_TEXT_LIMITS,
  DEFAULT_NEWSLETTER_CONTENT,
  DEFAULT_WRITING_INDEX_CONTENT,
} from "./defaults";

function coerceString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function coerceBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  return fallback;
}

function coerceNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.trunc(value)
    : fallback;
}

function normalizeSlug(value: unknown, fallback = "untitled"): string {
  const raw = coerceString(value, fallback)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return (raw || fallback).slice(0, CMS_TEXT_LIMITS.slug);
}

export function cmsProjectPageKey(slug: string): string {
  return `project:${normalizeSlug(slug, "project")}`;
}

export function cmsWritingPageKey(slug: string): string {
  return `writing:${normalizeSlug(slug, "writing")}`;
}

function normalizeTags(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((tag): tag is string => typeof tag === "string")
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 12);
  }
  if (typeof value === "string") {
    const parsed = parseJsonArray<string>(value);
    if (parsed.length > 0) return normalizeTags(parsed);
    return value
      .split(",")
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 12);
  }
  return [];
}

function normalizeLinks(value: unknown): CmsEditorLink[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((link): link is Record<string, unknown> =>
      Boolean(link && typeof link === "object"),
    )
    .map((link) => ({
      label: coerceString(link.label, "").trim(),
      url: coerceString(link.url ?? link.href, "").trim(),
    }))
    .filter((link) => link.label || link.url)
    .slice(0, 4);
}

function isSafeCmsUrl(url: string): boolean {
  if (!url || /[\u0000-\u001f\u007f\s]/.test(url)) return false;
  if (url.startsWith("/")) return !url.startsWith("//");
  if (!url.startsWith("https://") && !url.startsWith("mailto:")) return false;
  try {
    const parsed = new URL(url);
    return ["https:", "mailto:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

function validateCmsString(
  value: string,
  label: string,
  maxLength: number,
  required = true,
): string | null {
  if (required && !value.trim()) return `${label} is required`;
  if (value.length > maxLength) return `${label} is too long`;
  return null;
}

function validateCmsLinks(
  links: CmsEditorLink[],
  owner: string,
): string | null {
  for (const link of links) {
    const error =
      validateCmsString(
        link.label,
        `${owner} link label`,
        CMS_TEXT_LIMITS.linkLabel,
      ) ??
      validateCmsString(link.url, `${owner} link`, CMS_TEXT_LIMITS.linkUrl) ??
      (!isSafeCmsUrl(link.url)
        ? `${owner} link must start with /, https://, or mailto:`
        : null);
    if (error) return error;
  }
  return null;
}

function normalizeProjectStatus(value: unknown): CmsProjectContent["status"] {
  const status = coerceString(value, "wip").trim().toLowerCase();
  if (status === "live") return "live";
  if (status === "archived") return "archived";
  return "wip";
}

export function normalizeCmsProject(
  project: unknown,
  fallback?: Partial<CmsProjectContent>,
): CmsProjectContent {
  const source =
    project && typeof project === "object"
      ? (project as Record<string, unknown>)
      : {};
  const links = normalizeLinks(source.links);
  if (typeof source.link_live === "string" && source.link_live.trim()) {
    links.push({ label: "live site", url: source.link_live.trim() });
  }
  if (typeof source.link_repo === "string" && source.link_repo.trim()) {
    links.push({ label: "source", url: source.link_repo.trim() });
  }

  return {
    id: coerceString(source.id, fallback?.id ?? "") || undefined,
    slug: normalizeSlug(source.slug, fallback?.slug ?? "project"),
    title: coerceString(source.title, fallback?.title ?? "").trim(),
    status: normalizeProjectStatus(source.status ?? fallback?.status),
    year: coerceString(source.year, fallback?.year ?? "").trim(),
    range: coerceString(
      source.range ?? source.duration,
      fallback?.range ?? "",
    ).trim(),
    tags: normalizeTags(source.tags ?? fallback?.tags),
    summary: coerceString(
      source.summary ?? source.subtitle,
      fallback?.summary ?? "",
    ).trim(),
    body: coerceString(
      source.body ?? source.description,
      fallback?.body ?? "",
    ).trim(),
    links: links.slice(0, 4),
    featured: coerceBoolean(source.featured, fallback?.featured ?? false),
    order: coerceNumber(
      source.order ?? source.sort_order,
      fallback?.order ?? 0,
    ),
    visible: coerceBoolean(source.visible, fallback?.visible ?? true),
    updated_at:
      coerceString(source.updated_at, fallback?.updated_at ?? "") || null,
  };
}

export function validateCmsProject(project: CmsProjectContent): {
  ok: boolean;
  error?: string;
} {
  const error =
    validateCmsString(project.slug, "Project slug", CMS_TEXT_LIMITS.slug) ??
    validateCmsString(project.title, "Project title", CMS_TEXT_LIMITS.title) ??
    validateCmsString(project.year, "Project year", CMS_TEXT_LIMITS.year) ??
    validateCmsString(project.range, "Project range", CMS_TEXT_LIMITS.range) ??
    validateCmsString(
      project.summary,
      "Project summary",
      CMS_TEXT_LIMITS.summary,
    ) ??
    validateCmsString(project.body, "Project body", CMS_TEXT_LIMITS.body) ??
    project.tags
      .map((tag) =>
        validateCmsString(tag, "Project tag", CMS_TEXT_LIMITS.tag, true),
      )
      .find(Boolean) ??
    validateCmsLinks(project.links, "Project");
  return error ? { ok: false, error } : { ok: true };
}

export function normalizeCmsWriting(
  writing: unknown,
  fallback?: Partial<CmsWritingContent>,
): CmsWritingContent {
  const source =
    writing && typeof writing === "object"
      ? (writing as Record<string, unknown>)
      : {};
  const published = coerceBoolean(source.published, fallback?.visible ?? false);
  const status = coerceString(source.status, published ? "published" : "draft");

  return {
    id: coerceString(source.id, fallback?.id ?? "") || undefined,
    slug: normalizeSlug(source.slug, fallback?.slug ?? "writing"),
    title: coerceString(source.title, fallback?.title ?? "").trim(),
    date: coerceString(
      source.date ?? source.published_at ?? source.created_at,
      fallback?.date ?? "",
    ).trim(),
    tags: normalizeTags(source.tags ?? fallback?.tags),
    preview: coerceString(
      source.preview ?? source.summary,
      fallback?.preview ?? "",
    ).trim(),
    body: coerceString(
      source.body ?? source.content,
      fallback?.body ?? "",
    ).trim(),
    sourceLinks: normalizeLinks(
      source.sourceLinks ??
        (source.artifact_url
          ? [
              {
                label: coerceString(source.artifact_type, "source"),
                url: source.artifact_url,
              },
            ]
          : fallback?.sourceLinks),
    ),
    visible:
      source.visible === undefined
        ? status === "published"
        : coerceBoolean(source.visible, false),
    order: coerceNumber(source.order, fallback?.order ?? 0),
    updated_at:
      coerceString(source.updated_at, fallback?.updated_at ?? "") || null,
  };
}

export function validateCmsWriting(writing: CmsWritingContent): {
  ok: boolean;
  error?: string;
} {
  const error =
    validateCmsString(writing.slug, "Writing slug", CMS_TEXT_LIMITS.slug) ??
    validateCmsString(writing.title, "Writing title", CMS_TEXT_LIMITS.title) ??
    validateCmsString(writing.date, "Writing date", CMS_TEXT_LIMITS.year) ??
    validateCmsString(
      writing.preview,
      "Writing preview",
      CMS_TEXT_LIMITS.summary,
    ) ??
    validateCmsString(writing.body, "Writing body", CMS_TEXT_LIMITS.body) ??
    writing.tags
      .map((tag) =>
        validateCmsString(tag, "Writing tag", CMS_TEXT_LIMITS.tag, true),
      )
      .find(Boolean) ??
    validateCmsLinks(writing.sourceLinks, "Writing");
  return error ? { ok: false, error } : { ok: true };
}

export function normalizeNewsletterContent(
  content: unknown,
): NewsletterContent {
  const source =
    content && typeof content === "object"
      ? (content as Record<string, unknown>)
      : {};
  return {
    headline: coerceString(
      source.headline,
      DEFAULT_NEWSLETTER_CONTENT.headline,
    ).trim(),
    deck: coerceString(source.deck, DEFAULT_NEWSLETTER_CONTENT.deck).trim(),
    cta_label: coerceString(
      source.cta_label,
      DEFAULT_NEWSLETTER_CONTENT.cta_label,
    ).trim(),
    success_message: coerceString(
      source.success_message,
      DEFAULT_NEWSLETTER_CONTENT.success_message,
    ).trim(),
    error_message: coerceString(
      source.error_message,
      DEFAULT_NEWSLETTER_CONTENT.error_message,
    ).trim(),
    footer_text: coerceString(
      source.footer_text,
      DEFAULT_NEWSLETTER_CONTENT.footer_text,
    ).trim(),
    buttondown_url: coerceString(
      source.buttondown_url,
      DEFAULT_NEWSLETTER_CONTENT.buttondown_url,
    ).trim(),
    sender_name: coerceString(
      source.sender_name,
      DEFAULT_NEWSLETTER_CONTENT.sender_name,
    ).trim(),
    sender_email: coerceString(
      source.sender_email,
      DEFAULT_NEWSLETTER_CONTENT.sender_email,
    ).trim(),
    reply_to: coerceString(
      source.reply_to,
      DEFAULT_NEWSLETTER_CONTENT.reply_to,
    ).trim(),
  };
}

export function validateNewsletterContent(content: NewsletterContent): {
  ok: boolean;
  error?: string;
} {
  const error =
    validateCmsString(
      content.headline,
      "Newsletter headline",
      CMS_TEXT_LIMITS.newsletterHeadline,
    ) ??
    validateCmsString(
      content.deck,
      "Newsletter deck",
      CMS_TEXT_LIMITS.newsletterDeck,
    ) ??
    validateCmsString(
      content.cta_label,
      "Newsletter button",
      CMS_TEXT_LIMITS.linkLabel,
    ) ??
    validateCmsString(
      content.success_message,
      "Newsletter success message",
      CMS_TEXT_LIMITS.newsletterDeck,
    ) ??
    validateCmsString(
      content.error_message,
      "Newsletter error message",
      CMS_TEXT_LIMITS.newsletterDeck,
    ) ??
    validateCmsString(
      content.footer_text,
      "Newsletter footer",
      CMS_TEXT_LIMITS.newsletterFooter,
      false,
    ) ??
    validateCmsString(
      content.buttondown_url,
      "Newsletter URL",
      CMS_TEXT_LIMITS.linkUrl,
      false,
    ) ??
    validateCmsString(
      content.sender_name,
      "Sender name",
      CMS_TEXT_LIMITS.sender,
    ) ??
    validateCmsString(
      content.sender_email,
      "Sender email",
      CMS_TEXT_LIMITS.sender,
    ) ??
    validateCmsString(content.reply_to, "Reply-to", CMS_TEXT_LIMITS.sender);
  if (error) return { ok: false, error };
  if (content.buttondown_url && !isSafeCmsUrl(content.buttondown_url)) {
    return { ok: false, error: "Newsletter URL is invalid" };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(content.sender_email)) {
    return { ok: false, error: "Sender email is invalid" };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(content.reply_to)) {
    return { ok: false, error: "Reply-to is invalid" };
  }
  return { ok: true };
}

export function normalizeListingPageContent(
  content: unknown,
  fallback: ListingPageContent = DEFAULT_WRITING_INDEX_CONTENT,
): ListingPageContent {
  const source =
    content && typeof content === "object"
      ? (content as Record<string, unknown>)
      : {};

  return {
    title: coerceString(source.title, fallback.title).trim(),
    description: coerceString(source.description, fallback.description).trim(),
    hero_title: coerceString(source.hero_title, fallback.hero_title).trim(),
    hero_summary: coerceString(
      source.hero_summary,
      fallback.hero_summary,
    ).trim(),
    search_placeholder: coerceString(
      source.search_placeholder,
      fallback.search_placeholder ?? "",
    ).trim(),
  };
}

export function validateListingPageContent(content: ListingPageContent): {
  ok: boolean;
  error?: string;
} {
  const error =
    validateCmsString(
      content.title,
      "Listing page title",
      CMS_TEXT_LIMITS.title,
    ) ??
    validateCmsString(
      content.description,
      "Listing page description",
      CMS_TEXT_LIMITS.summary,
    ) ??
    validateCmsString(
      content.hero_title,
      "Listing page hero title",
      CMS_TEXT_LIMITS.title,
    ) ??
    validateCmsString(
      content.hero_summary,
      "Listing page hero summary",
      CMS_TEXT_LIMITS.summary,
    ) ??
    validateCmsString(
      content.search_placeholder ?? "",
      "Listing page search placeholder",
      CMS_TEXT_LIMITS.title,
      false,
    );

  return error ? { ok: false, error } : { ok: true };
}
