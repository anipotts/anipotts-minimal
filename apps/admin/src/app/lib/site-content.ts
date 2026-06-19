import { revalidatePath } from "next/cache";
import {
  cmsProjectPageKey,
  cmsWritingPageKey,
  normalizeCmsProject,
  normalizeCmsWriting,
  normalizeHomepageContent,
  normalizeNewsletterContent,
  validateCmsProject,
  validateCmsWriting,
  validateHomepageContent,
  validateNewsletterContent,
} from "@anipotts/lib/cms";
import type {
  CmsProjectContent,
  CmsWritingContent,
  HomepageContent,
  NewsletterContent,
} from "@anipotts/types";
import { savePageContent } from "./page-content";

export async function saveHomepageDraft(draft: HomepageContent) {
  const content = normalizeHomepageContent(draft);
  const validation = validateHomepageContent(content);
  if (!validation.ok) return { error: validation.error ?? "Invalid homepage" };

  const result = await savePageContent("home", content);
  if ("error" in result) return result;
  revalidatePath("/");
  return result;
}

export async function saveNewsletterDraft(draft: NewsletterContent) {
  const content = normalizeNewsletterContent(draft);
  const validation = validateNewsletterContent(content);
  if (!validation.ok)
    return { error: validation.error ?? "Invalid newsletter" };

  const result = await savePageContent("newsletter", content);
  if ("error" in result) return result;
  revalidatePath("/");
  return result;
}

export async function saveProjectDraft(draft: CmsProjectContent) {
  const project = normalizeCmsProject(draft);
  const validation = validateCmsProject(project);
  if (!validation.ok) return { error: validation.error ?? "Invalid project" };

  const result = await savePageContent(
    cmsProjectPageKey(project.slug),
    project,
  );
  if ("error" in result) return result;
  revalidatePath("/");
  revalidatePath("/projects");
  revalidatePath("/making");
  return {
    success: true,
    project: { ...result.content, updated_at: result.updatedAt },
  };
}

export async function saveWritingDraft(draft: CmsWritingContent) {
  const writing = normalizeCmsWriting(draft);
  const validation = validateCmsWriting(writing);
  if (!validation.ok) return { error: validation.error ?? "Invalid writing" };

  const result = await savePageContent(
    cmsWritingPageKey(writing.slug),
    writing,
  );
  if ("error" in result) return result;
  revalidatePath("/");
  revalidatePath("/writing");
  return {
    success: true,
    writing: { ...result.content, updated_at: result.updatedAt },
  };
}
