// Supabase
export {
  supabase,
  isSupabaseConfigured,
  createServerClient,
  createClient,
} from "./supabase";
export type { SupabaseClient } from "./supabase";

// Utilities
export {
  cn,
  formatDate,
  formatRelativeTime,
  truncate,
  slugify,
  formatShortRelativeTime,
  formatNumber,
  parseTags,
} from "./utils";

// Constants
export { SITE_VERSION } from "./constants";

// Feature flags
export {
  featureFlags,
  isFeatureEnabled,
} from "./feature-flags";
export type { FeatureFlags, FeatureFlagKey } from "./feature-flags";

// Validation
export {
  contactSchema,
  favoriteNumberSchema,
  adminLoginSchema,
  formatZodError,
} from "./validation";
