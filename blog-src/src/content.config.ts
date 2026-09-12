import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './source/_posts' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    last_verified: z.coerce.date().optional(),
    description: z.string().default(''),
    cover: z.string().optional(),
    tags: z.array(z.string()).default([]),
    categories: z.array(z.string()).default([]),
    keywords: z.array(z.string()).optional(),
    series: z.string().optional(),
    series_title: z.string().optional(),
    series_order: z.coerce.number().optional(),
    draft: z.boolean().default(false)
  })
});

export const collections = { posts };
