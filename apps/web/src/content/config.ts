import { defineCollection } from 'astro:content';
import { Article } from '@snowstep/shared';

const articles = defineCollection({
  type: 'content',
  schema: Article,
});

export const collections = { articles };

