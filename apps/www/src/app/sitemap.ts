import { MetadataRoute } from 'next';
import { createClient } from '@anipotts/lib/supabase';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://anipotts.com';

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

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
  ];

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

  return [...staticPages, ...thoughtPages];
}
