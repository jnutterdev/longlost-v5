import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const dateField = z.union([z.string(), z.date()]).transform(d => d instanceof Date ? d.toISOString() : d);

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    date: dateField,
    excerpt: z.string().optional(),
    tag: z.union([z.string(), z.array(z.string())]).optional()
      .transform(t => t === undefined ? [] : Array.isArray(t) ? t : [t]),
    readTime: z.string().optional(),
    image: z.string().optional(),
    featured: z.boolean().optional().default(false),
    draft: z.boolean().optional().default(false),
    blueskyUrl: z.string().optional(),
    mastodonUrl: z.string().optional(),
    currentMusic: z.string().optional(),
    currentMood: z.string().optional(),
  }),
});

const photos = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/photos' }),
  schema: z.object({
    title: z.string(),
    image: z.string(),
    alt: z.string(),
    date: dateField,
    location: z.string().optional(),
    tags: z.array(z.string()).optional().default([]),
    draft: z.boolean().optional().default(false),
  }),
});

export const collections = { posts, photos };
