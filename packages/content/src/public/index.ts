export {
  DEFAULT_CMS_PROJECTS,
  DEFAULT_CMS_WRITING,
  DEFAULT_HOMEPAGE_CONTENT,
  DEFAULT_MAKING_INDEX_CONTENT,
  DEFAULT_NEWSLETTER_CONTENT,
  DEFAULT_NEWSLETTER_ARCHIVE_CONTENT,
  DEFAULT_ORCHESTRATING_CONTENT,
  DEFAULT_PROJECTS_INDEX_CONTENT,
  DEFAULT_WRITING_INDEX_CONTENT,
  HOME_SECTION_ORDER,
  HOMEPAGE_FIELD_LIMITS,
  CMS_TEXT_LIMITS,
} from "./defaults.js";
export {
  cmsProjectPageKey,
  cmsWritingPageKey,
  normalizeListingPageContent,
  normalizeCmsProject,
  normalizeCmsWriting,
  normalizeNewsletterContent,
  normalizeOrchestratingPageContent,
  validateListingPageContent,
  validateCmsProject,
  validateCmsWriting,
  validateNewsletterContent,
  validateOrchestratingPageContent,
} from "./editor.js";
export {
  homepageSummaryText,
  normalizeHomepageContent,
  validateHomepageContent,
} from "./homepage.js";

export type {
  HomepageMention,
  HomepageRichSummarySegment,
  HomepageRichSummarySentence,
  HomepageRichSummarySimpleSegment,
  ListingPageContent,
  OrchestratingPageContent,
  ThoughtSummary,
  WritingSummary,
} from "@anipotts/types";
