export {
  DEFAULT_CMS_PROJECTS,
  DEFAULT_CMS_WRITING,
  DEFAULT_HOMEPAGE_CONTENT,
  DEFAULT_MAKING_INDEX_CONTENT,
  DEFAULT_NEWSLETTER_CONTENT,
  DEFAULT_PROJECTS_INDEX_CONTENT,
  DEFAULT_WRITING_INDEX_CONTENT,
} from "./defaults";
export {
  cmsProjectPageKey,
  cmsWritingPageKey,
  normalizeListingPageContent,
  normalizeCmsProject,
  normalizeCmsWriting,
  normalizeNewsletterContent,
  validateListingPageContent,
  validateCmsProject,
  validateCmsWriting,
  validateNewsletterContent,
} from "./editor";
export {
  fetchHomepageContent,
  homepageSummaryText,
  normalizeHomepageContent,
  validateHomepageContent,
} from "./homepage";
export { fetchPageContent } from "./page";
export { fetchProjects } from "./projects";
export {
  fetchAllSiteSettings,
  fetchSiteConfig,
  fetchSiteSetting,
  fetchSocialLinks,
} from "./settings";
export { fetchCmsEditorSnapshot } from "./snapshot";
export { fetchWriting, searchWriting } from "./writing";

export type {
  HomepageMention,
  HomepageRichSummarySegment,
  HomepageRichSummarySentence,
  HomepageRichSummarySimpleSegment,
  ListingPageContent,
  ThoughtSummary,
  WritingSummary,
} from "@anipotts/types";
