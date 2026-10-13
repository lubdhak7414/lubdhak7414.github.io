import { defineCollection } from 'astro:content'
import type { SchemaContext } from 'astro:content'
import { z } from 'astro/zod'
import { glob } from 'astro/loaders'

function removeDupsAndLowerCase(array: string[]) {
	if (!array.length) return array
	const lowercaseItems = array.map((str) => str.toLowerCase())
	const distinctItems = new Set(lowercaseItems)
	return Array.from(distinctItems)
}

// Fields shared by both content types. Posts and projects keep the same frontmatter, so
// moving an entry between collections never touches its date, slug or metadata.
const entrySchema = ({ image }: SchemaContext) =>
	z.object({
		title: z.string().max(60),
		description: z.string().min(50).max(160),
		publishDate: z
			.string()
			.or(z.date())
			.transform((val) => new Date(val)),
		updatedDate: z
			.string()
			.optional()
			.transform((str) => (str ? new Date(str) : undefined)),
		coverImage: z
			.object({
				src: image(),
				alt: z.string()
			})
			.optional(),
		draft: z.boolean().default(false),
		tags: z.array(z.string()).default([]).transform(removeDupsAndLowerCase),
		ogImage: z.string().optional(),
		homePageIdx: z.number().optional()
	})

// Long-form writing at /blog/<id>/.
const post = defineCollection({
	loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/post' }),
	schema: entrySchema
})

// Things that were built, at /projects/<id>/ and in the homepage project list.
// `links` render in the page header and the homepage row; `facts` render as the facts
// rail. Every key is optional and only rendered when present: never fill a slot the
// write-up doesn't state.
const project = defineCollection({
	loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/project' }),
	schema: (context) =>
		entrySchema(context).extend({
			links: z
				.array(
					z.object({
						label: z.string(),
						url: z.url(),
						kind: z.enum(['code', 'live', 'store']).default('code')
					})
				)
				.default([]),
			facts: z
				.object({
					client: z.string().optional(),
					role: z.string().optional(),
					timeline: z.string().optional(),
					status: z.string().optional(),
					license: z.string().optional(),
					stack: z.array(z.string()).optional()
				})
				.default({})
		})
})

export const collections = { post, project }
