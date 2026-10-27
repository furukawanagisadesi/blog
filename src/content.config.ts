import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { isUpdatedAfterPublished } from './lib/dates';

const blog = defineCollection({
	// Load Markdown and MDX files in the `src/content/blog/` directory.
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	// Type-check frontmatter using a schema
	schema: ({ image }) =>
		z
			.object({
				title: z.string(),
				description: z.string(),
				// Transform string to Date object
				pubDate: z.coerce.date(),
				updatedDate: z.coerce.date().optional(),
				heroImage: z.optional(image()),
				tags: z.array(z.string()).default([]),
			})
			.superRefine((data, ctx) => {
				if (
					data.updatedDate &&
					data.updatedDate.getTime() !== data.pubDate.getTime() &&
					!isUpdatedAfterPublished(data.pubDate, data.updatedDate)
				) {
					ctx.addIssue({
						code: 'custom',
						path: ['updatedDate'],
						message: 'updatedDate 不能早于 pubDate',
					});
				}
			}),
});

export const collections = { blog };
