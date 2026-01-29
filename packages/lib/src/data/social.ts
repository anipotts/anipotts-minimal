import type { SocialLink } from "@anipotts/types";

/**
 * Canonical list of all social/contact links.
 * Used by: www/connect, links subdomain, metadata, SubdomainNavigator.
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
];

/** Social handle used across platforms */
export const SOCIAL_HANDLE = "@anipottsbuilds";

/** Primary contact email */
export const CONTACT_EMAIL = "contact@anipotts.com";
