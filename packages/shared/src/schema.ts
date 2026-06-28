import { z } from 'zod'

export const Article = z.object({
  title: z.string(),
  type: z.enum(['note', 'clipped']),
  category: z.array(z.string()).min(1),
  tags: z.array(z.string()).default([]),
  created: z.coerce.string(),
  updated: z.coerce.string(),
  sourceUrl: z.string().url().optional(),
  siteName: z.string().optional(),
  private: z.boolean().default(false),
})

export type Article = z.infer<typeof Article>

