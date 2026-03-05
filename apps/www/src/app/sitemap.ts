import type { MetadataRoute } from "next";
import { getPublishedThoughts } from "@/content/thoughts";
import { projectEntries } from "@/content/projects";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://anipotts.com";
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/work`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/thoughts`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/claude`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/connect`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];

  const thoughts = await getPublishedThoughts();

  const thoughtPages: MetadataRoute.Sitemap = thoughts.map((thought) => ({
    url: `${baseUrl}/thoughts/${thought.slug}`,
    lastModified: new Date(thought.date),
    changeFrequency: "monthly",
    priority: 0.65,
  }));

  const publishedProjects = projectEntries.filter(
    (p) => p.links?.page && p.publishState === "publish_now",
  );

  const projectPages: MetadataRoute.Sitemap = publishedProjects.map((project) => ({
    url: `${baseUrl}/projects/${project.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticPages, ...thoughtPages, ...projectPages];
}
