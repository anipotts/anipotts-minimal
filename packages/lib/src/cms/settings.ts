import type { SiteSettingsMap, SocialLink } from "@anipotts/types";
import { asc, eq } from "drizzle-orm";
import { socialLinks as FALLBACK_SOCIAL_LINKS } from "../data/social";
import { getDrizzle } from "../db";
import * as s from "../db/schema";
import { logger } from "../logger";

export async function fetchSocialLinks(): Promise<SocialLink[]> {
  const db = getDrizzle();
  if (db) {
    try {
      const results = await db
        .select()
        .from(s.socialLinks)
        .where(eq(s.socialLinks.visible, true))
        .orderBy(asc(s.socialLinks.sort_order));
      if (results.length === 0) return FALLBACK_SOCIAL_LINKS;
      return results.map((row) => ({
        name: row.name,
        url: row.url,
        icon: row.icon,
        description: row.description ?? undefined,
      }));
    } catch (err) {
      logger.warn("cms", "D1 fetchSocialLinks() failed, using fallback", {
        error: String(err),
      });
      return FALLBACK_SOCIAL_LINKS;
    }
  }

  return FALLBACK_SOCIAL_LINKS;
}

export async function fetchSiteSetting(key: string): Promise<string | null> {
  const db = getDrizzle();
  if (db) {
    try {
      const rows = await db
        .select({ value: s.siteSettings.value })
        .from(s.siteSettings)
        .where(eq(s.siteSettings.key, key));
      return rows[0]?.value ?? null;
    } catch (err) {
      logger.warn("cms", `D1 fetchSiteSetting("${key}") failed`, {
        error: String(err),
      });
      return null;
    }
  }

  return null;
}

export async function fetchAllSiteSettings(): Promise<SiteSettingsMap> {
  const db = getDrizzle();
  if (db) {
    try {
      const results = await db
        .select({ key: s.siteSettings.key, value: s.siteSettings.value })
        .from(s.siteSettings);
      const map: SiteSettingsMap = {};
      for (const row of results) {
        map[row.key] = row.value;
      }
      return map;
    } catch (err) {
      logger.warn("cms", "D1 fetchAllSiteSettings() failed", {
        error: String(err),
      });
      return {};
    }
  }

  return {};
}

export async function fetchSiteConfig(): Promise<{
  name: string;
  fullName: string;
  title: string;
  location: string;
  bio: string;
  shortBio: string;
  domain: string;
  url: string;
  email: string;
  handle: string;
  github: string;
  headshot: string;
  ogImage: string;
}> {
  const { site } = await import("../data/site");
  const settings = await fetchAllSiteSettings();
  return {
    ...site,
    name: settings.site_name || site.name,
    title: settings.site_title || site.title,
    location: settings.site_location || site.location,
    bio: settings.site_bio || site.bio,
    shortBio: settings.site_short_bio || site.shortBio,
    email: settings.site_email || site.email,
  };
}
