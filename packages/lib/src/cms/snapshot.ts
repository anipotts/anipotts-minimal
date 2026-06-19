import type {
  CmsEditorMeta,
  CmsEditorSnapshot,
  CmsProjectContent,
  CmsWritingContent,
  HomepageContent,
  NewsletterContent,
  PageContent,
} from "@anipotts/types";
import { DEFAULT_CMS_PROJECTS, DEFAULT_CMS_WRITING } from "./defaults";
import {
  cmsProjectPageKey,
  cmsWritingPageKey,
  normalizeCmsProject,
  normalizeCmsWriting,
  normalizeNewsletterContent,
} from "./editor";
import { normalizeHomepageContent } from "./homepage";
import { fetchPageContent } from "./page";

function pageMeta(page: PageContent<unknown> | null): CmsEditorMeta {
  return {
    source: page ? "cms" : "fallback",
    updated_at: page?.updated_at ?? null,
    version: page?.version ?? null,
  };
}

async function fetchProjectEditorContent(
  fallback: CmsProjectContent,
): Promise<CmsProjectContent> {
  const page = await fetchPageContent<CmsProjectContent>(
    cmsProjectPageKey(fallback.slug),
  );
  if (!page) return fallback;
  return {
    ...normalizeCmsProject(page.content, fallback),
    updated_at: page.updated_at,
  };
}

async function fetchWritingEditorContent(
  fallback: CmsWritingContent,
): Promise<CmsWritingContent> {
  const page = await fetchPageContent<CmsWritingContent>(
    cmsWritingPageKey(fallback.slug),
  );
  if (!page) return fallback;
  return {
    ...normalizeCmsWriting(page.content, fallback),
    updated_at: page.updated_at,
  };
}

export async function fetchCmsEditorSnapshot(): Promise<CmsEditorSnapshot> {
  const [homePage, newsletterPage, projects, writing] = await Promise.all([
    fetchPageContent<HomepageContent>("home"),
    fetchPageContent<NewsletterContent>("newsletter"),
    Promise.all(DEFAULT_CMS_PROJECTS.map(fetchProjectEditorContent)),
    Promise.all(DEFAULT_CMS_WRITING.map(fetchWritingEditorContent)),
  ]);

  return {
    homepage: normalizeHomepageContent(homePage?.content),
    homepageMeta: pageMeta(homePage as PageContent<unknown> | null),
    projects: projects.sort((a, b) => b.order - a.order),
    writing: writing.sort((a, b) => b.order - a.order),
    newsletter: normalizeNewsletterContent(newsletterPage?.content),
    newsletterMeta: pageMeta(newsletterPage as PageContent<unknown> | null),
  };
}
