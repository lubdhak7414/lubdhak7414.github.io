import type { CollectionEntry } from 'astro:content'

type Post = CollectionEntry<'post'>

/** One line per series for the Writing list and the hub page header. */
const SERIES_ABOUT: Record<string, string> = {
	'CSE 425 Mid':
		'Worked notes for the CSE 425 midterm, from the perceptron to the GRU, with the numbers done by hand.',
	'CSE 425 Final':
		'Worked notes for the CSE 425 final, from CNNs to Kohonen maps, with the numbers done by hand.'
}

export interface Series {
	name: string
	slug: string
	about: string
	/** In reading order (by `part`). */
	parts: Post[]
}

export type WritingItem = { kind: 'post'; entry: Post } | { kind: 'series'; series: Series }

export const seriesSlug = (name: string) =>
	name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '')

/** Every series that has at least one post, with its parts in order. */
export function getSeries(posts: Post[]): Series[] {
	const byName = new Map<string, Post[]>()
	for (const post of posts) {
		const name = post.data.series
		if (name) byName.set(name, [...(byName.get(name) ?? []), post])
	}
	return [...byName].map(([name, parts]) => ({
		name,
		slug: seriesSlug(name),
		about: SERIES_ABOUT[name] ?? '',
		parts: parts.sort((a, b) => (a.data.part ?? 0) - (b.data.part ?? 0))
	}))
}

/**
 * The Writing list: posts newest first, but a series is ONE item, at the place of its newest
 * part. Pass posts already sorted newest first.
 */
export function writingItems(posts: Post[]): WritingItem[] {
	const series = getSeries(posts)
	const seen = new Set<string>()
	const items: WritingItem[] = []
	for (const entry of posts) {
		const name = entry.data.series
		if (!name) {
			items.push({ kind: 'post', entry })
		} else if (!seen.has(name)) {
			seen.add(name)
			items.push({ kind: 'series', series: series.find((s) => s.name === name)! })
		}
	}
	return items
}
