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
	schema: (context) =>
		entrySchema(context).extend({
			// A course series: posts sharing `series` are listed on one hub page, grouped by
			// `section` and ordered by `part` within it.
			series: z.string().optional(),
			section: z.string().optional(),
			part: z.number().int().optional()
		})
})

// Things that were built, at /projects/<id>/ and in the homepage project list.
// `name` is the short name the work list prints (the title is the page headline). `links`
// and `facts` render in the case study's details column. Every key is optional and only rendered when present: never fill a slot the
// write-up doesn't state.
const project = defineCollection({
	loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/project' }),
	schema: (context) =>
		entrySchema(context).extend({
			name: z.string().max(32).optional(),
			// A real screenshot of the thing: the work tiles, the case-study cover and the
			// next/previous thumbnails. Projects without one get a plain text box instead.
			shot: z
				.object({
					src: context.image(),
					alt: z.string()
				})
				.optional(),
			links: z
				.array(
					z.object({
						label: z.string(),
						// What this link is in two or three words, for the project lists when one
						// project has several links of a kind (three repos, say).
						short: z.string().max(16).optional(),
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
				.default({}),
			// The spec sheet at the top of a project page: what it does and the owner's part, in
			// one plain sentence each, taken from the write-up. Leave a key out rather than guess.
			glance: z
				.object({
					does: z.string().optional(),
					did: z.string().optional()
				})
				.default({})
		})
})

export const collections = { post, project }
