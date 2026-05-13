import { defineCollection, z } from 'astro:content'
import { glob } from "astro/loaders";

const blogCollection = defineCollection({
    loader: glob({ pattern: '**/[^_]*.md', base: "./src/content/blog" }),
    schema: z.object({
        title: z.string(),
        pubDate: z.date(),
        draft: z.boolean().optional().default(false),
        description: z.string().optional().default(''),
        image: z.string().optional().default(''),
        slugId: z.string(),
        // pinned: optional numeric priority; if absent, article is not pinned
        pinned: z.number().optional(),
        category: z.string().optional(),
        categories: z.array(z.string()).optional().default([]),
    }),
})

const specCollection = defineCollection({
    loader: glob({ pattern: '**/[^_]*.md', base: "./src/content/spec" }),
})
const memosCollection = defineCollection({
    loader: glob({ pattern: '**/[^_]*.md', base: "./src/content/memos" }),
})
const appreciationCollection = defineCollection({
    loader: glob({ pattern: '**/[^_]*.md', base: "./src/content/appreciation" }),
    schema: z.object({
        title: z.string(),
        pubDate: z.date(),
        draft: z.boolean().optional().default(false),
        description: z.string().optional().default(''),
        image: z.string().optional().default(''),
        slugId: z.string(),
        pinned: z.number().optional(),
        category: z.string().optional(),
        categories: z.array(z.string()).optional().default([]),
    }),
})
export const collections = {
    blog: blogCollection,
    spec: specCollection,
    memos: memosCollection,
    appreciation: appreciationCollection,
}