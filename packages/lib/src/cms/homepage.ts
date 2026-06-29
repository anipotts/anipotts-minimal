import type { HomepageContent } from "@anipotts/types";
import {
  homepageSummaryText,
  normalizeHomepageContent,
  validateHomepageContent,
} from "@anipotts/content/public/homepage";
import { fetchPageContent } from "./page";

export {
  homepageSummaryText,
  normalizeHomepageContent,
  validateHomepageContent,
};

export async function fetchHomepageContent(): Promise<HomepageContent> {
  const page = await fetchPageContent<HomepageContent>("home");
  return normalizeHomepageContent(page?.content);
}
