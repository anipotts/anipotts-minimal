import type { SocialLink } from "@anipotts/types";

/**
 * Canonical list of all social/contact links.
 * Used by: CMS fallback data and metadata.
 */
export const socialLinks: SocialLink[] = [
  {
    name: "email",
    url: "mailto:contact@anipotts.com",
    icon: "email",
    description: "contact@anipotts.com",
  },
  {
    name: "github",
    url: "https://github.com/anipotts",
    icon: "github",
    description: "@anipotts",
  },
  {
    name: "github sponsors",
    url: "https://github.com/sponsors/anipotts",
    icon: "heart",
    description: "sponsors/anipotts",
  },
  {
    name: "linkedin",
    url: "https://www.linkedin.com/in/anipotts",
    icon: "linkedin",
    description: "anipotts",
  },
  {
    name: "x",
    url: "https://x.com/anipottsbuilds",
    icon: "x",
    description: "@anipottsbuilds",
  },
  {
    name: "instagram",
    url: "https://instagram.com/anipottsbuilds",
    icon: "instagram",
    description: "@anipottsbuilds",
  },
  {
    name: "tiktok",
    url: "https://tiktok.com/@anipottsbuilds",
    icon: "tiktok",
    description: "@anipottsbuilds",
  },
  {
    name: "mastodon",
    url: "https://mastodon.social/@anipotts",
    icon: "mastodon",
    description: "@anipotts@mastodon.social",
  },
  {
    name: "newsletter",
    url: "https://news.anipotts.com",
    icon: "email",
    description: "Ani Potts Builds",
  },
  {
    name: "buy me a coffee",
    url: "https://buymeacoffee.com/anipotts",
    icon: "coffee",
    description: "buymeacoffee.com/anipotts",
  },
];

/** Alias for static fallback data */
export const FALLBACK_SOCIAL_LINKS = socialLinks;

/** Social handle used across platforms */
export const SOCIAL_HANDLE = "@anipottsbuilds";

/** Primary contact email */
export const CONTACT_EMAIL = "contact@anipotts.com";
