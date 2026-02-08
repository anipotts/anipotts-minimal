import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabaseClient';
import { projects } from '@/data/projects';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://anipotts.com';

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/work`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/thoughts`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/connect`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/dev`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/links`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/updates`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/status`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/lab`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/docs`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
  ];

  // Project pages (featured ones with dedicated pages)
  const projectPages: MetadataRoute.Sitemap = projects
    .filter((p) => p.featured && p.links?.page)
    .map((project) => ({
      url: `${baseUrl}${project.links!.page}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }));

  // Dynamic thought/blog pages
  let thoughtPages: MetadataRoute.Sitemap = [];
  if (supabase) {
    try {
      const { data: thoughts } = await supabase
        .from('thoughts')
        .select('slug, updated_at')
        .eq('published', true);

      if (thoughts) {
        thoughtPages = thoughts.map((thought) => ({
          url: `${baseUrl}/thoughts/${thought.slug}`,
          lastModified: new Date(thought.updated_at),
          changeFrequency: 'monthly' as const,
          priority: 0.6,
        }));
      }
    } catch (e) {
      console.error('Error fetching thoughts for sitemap:', e);
    }
  }

  return [...staticPages, ...projectPages, ...thoughtPages];
}
