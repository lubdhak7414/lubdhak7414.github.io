import type { CollectionEntry } from 'astro:content'

import { curlQuotes } from './typeset'

type Post = CollectionEntry<'post'>

/** The title and one line for each series, used by the Writing list and the hub header. */
const SERIES_META: Record<string, { title: string; about: string }> = {
	'CSE 425': {
		title: 'CSE 425: Neural Networks, worked by hand',
		about:
			'My notes for CSE 425 at BRAC University: 24 short posts from the perceptron to Kohonen maps, with the numbers worked out by hand.'
	}
}

/** Sections of a series in reading order; anything not listed follows alphabetically. */
const SECTION_ORDER = ['Mid', 'Final']

export interface SeriesSection {
	label: string
	/** In reading order (by `part`). */
	parts: Post[]
}

export interface Series {
	name: string
	title: string
	slug: string
	about: string
	/** Every part in reading order: section by section, then by `part`. */
	parts: Post[]
	sections: SeriesSection[]
}

export type WritingItem = { kind: 'post'; entry: Post } | { kind: 'series'; series: Series }

export const seriesSlug = (name: string) =>
	name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '')

const rank = (label: string) => {
	const at = SECTION_ORDER.indexOf(label)
	return at === -1 ? SECTION_ORDER.length : at
}

/** Every series that has at least one post, with its sections and parts in order. */
export function getSeries(posts: Post[]): Series[] {
	const byName = new Map<string, Post[]>()
	for (const post of posts) {
		const name = post.data.series
		if (name) byName.set(name, [...(byName.get(name) ?? []), post])
	}
	return [...byName].map(([name, members]) => {
		const bySection = new Map<string, Post[]>()
		for (const post of members) {
			const label = post.data.section ?? ''
			bySection.set(label, [...(bySection.get(label) ?? []), post])
		}
		const sections = [...bySection]
			.map(([label, parts]) => ({
				label,
				parts: parts.sort((a, b) => (a.data.part ?? 0) - (b.data.part ?? 0))
			}))
			.sort((a, b) => rank(a.label) - rank(b.label) || a.label.localeCompare(b.label))
		const meta = SERIES_META[name]
		return {
			name,
			title: meta?.title ?? name,
			slug: seriesSlug(name),
			about: meta?.about ?? '',
			parts: sections.flatMap((section) => section.parts),
			sections
		}
	})
}

export interface SeriesPlace {
	section: SeriesSection
	/** 0-based position inside the section (the half). */
	index: number
	/** Notes in the same half, when there is one. */
	prev?: Post | undefined
	next?: Post | undefined
	/** At either end of a half: the neighbouring half's last or first note. */
	prevHalf?: { section: SeriesSection; post: Post } | undefined
	nextHalf?: { section: SeriesSection; post: Post } | undefined
}

/** Where a note sits: its half, its number inside that half, and the way on in either direction. */
export function seriesPlace(series: Series, id: string): SeriesPlace {
	const s = Math.max(
		0,
		series.sections.findIndex((section) => section.parts.some((part) => part.id === id))
	)
	const section = series.sections[s]!
	const index = section.parts.findIndex((part) => part.id === id)
	const before = series.sections[s - 1]
	const after = series.sections[s + 1]
	return {
		section,
		index,
		prev: section.parts[index - 1],
		next: section.parts[index + 1],
		prevHalf: index === 0 && before ? { section: before, post: before.parts.at(-1)! } : undefined,
		nextHalf:
			index === section.parts.length - 1 && after
				? { section: after, post: after.parts[0]! }
				: undefined
	}
}

/** "Mid, note 5 of 13" (or "Note 5 of 13" for a series without halves). */
export function noteLabel(place: SeriesPlace): string {
	const n = `note ${place.index + 1} of ${place.section.parts.length}`
	return place.section.label ? `${place.section.label}, ${n}` : n[0]!.toUpperCase() + n.slice(1)
}

/**
 * A title made ready for the page: short phrases (between colons and commas) never split
 * across lines, "Part 1" keeps its number, and "Self-Organizing" never breaks at the hyphen.
 * Rendering only: the frontmatter and the head keep the plain title.
 */
export function tidyTitle(title: string): string {
	return curlQuotes(title)
		.split(/(?<=[:,]) /)
		.map((chunk) => (chunk.length <= 18 ? chunk.replace(/ /g, ' ') : chunk))
		.join(' ')
		.replace(/\b(Part|Note|CSE) (\d+)/g, '$1 $2')
		.replace(/(\p{L})-(\p{L})/gu, '$1-⁠$2')
}

/**
 * The Writing list: posts newest first, but a series is ONE item, at the place of its newest
 * part. Its parts never get a row of their own: they are reached from the series page.
 * Pass posts already sorted newest first.
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
