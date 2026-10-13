import type { CollectionEntry } from 'astro:content'
import { getCollection } from 'astro:content'

export type Entry = CollectionEntry<'post'> | CollectionEntry<'project'>

/** Note: this function filters out draft posts based on the environment */
export async function getAllPosts() {
	return await getCollection('post', ({ data }) => {
		return import.meta.env.PROD ? data.draft !== true : true
	})
}

/**
 * Projects in homepage order: `homePageIdx` first, then newest, then title. Callers must
 * not re-sort. Drafts are filtered in production only, like posts.
 */
export async function getAllProjects() {
	const projects = await getCollection('project', ({ data }) => {
		return import.meta.env.PROD ? data.draft !== true : true
	})
	return projects.sort(
		(a, b) =>
			(a.data.homePageIdx ?? Infinity) - (b.data.homePageIdx ?? Infinity) ||
			b.data.publishDate.valueOf() - a.data.publishDate.valueOf() ||
			a.data.title.localeCompare(b.data.title)
	)
}

/** Canonical URL path for a post or a project. */
export function entryHref(entry: Entry) {
	return entry.collection === 'project' ? `/projects/${entry.id}/` : `/blog/${entry.id}/`
}

/** Tags worth showing next to an item: `project` is a bookkeeping tag, not a topic. */
export function displayTags(entry: Entry) {
	return entry.data.tags.filter((tag) => tag !== 'project')
}

export function sortMDByDate<T extends Entry>(posts: Array<T>) {
	return [...posts].sort((a, b) => {
		const aDate = new Date(a.data.updatedDate ?? a.data.publishDate).valueOf()
		const bDate = new Date(b.data.updatedDate ?? b.data.publishDate).valueOf()
		return bDate - aDate
	})
}

/** Newest first by original publish date (the date the blog index shows and groups by). */
export function sortByPublishDate<T extends Entry>(posts: Array<T>) {
	return [...posts].sort((a, b) => b.data.publishDate.valueOf() - a.data.publishDate.valueOf())
}

/** Note: This function doesn't filter draft posts, pass it the result of getAllPosts above to do so. */
export function getAllTags(posts: Array<Entry>) {
	return posts.flatMap((post) => [...post.data.tags])
}

/** Note: This function doesn't filter draft posts, pass it the result of getAllPosts above to do so. */
export function getUniqueTags(posts: Array<Entry>) {
	return [...new Set(getAllTags(posts))]
}

export function getRelatedPosts(
	current: CollectionEntry<'post'>,
	allPosts: CollectionEntry<'post'>[],
	count = 3
): CollectionEntry<'post'>[] {
	const currentTags = new Set(current.data.tags)
	return allPosts
		.filter((p) => p.id !== current.id)
		.map((p) => ({
			post: p,
			score: p.data.tags.filter((t) => currentTags.has(t)).length
		}))
		.filter(({ score }) => score > 0)
		.sort(
			(a, b) =>
				b.score - a.score ||
				new Date(b.post.data.updatedDate ?? b.post.data.publishDate).valueOf() -
					new Date(a.post.data.updatedDate ?? a.post.data.publishDate).valueOf()
		)
		.slice(0, count)
		.map(({ post }) => post)
}

/** Note: This function doesn't filter draft posts, pass it the result of getAllPosts above to do so. */
export function getUniqueTagsWithCount(posts: Array<Entry>): Array<[string, number]> {
	return [
		...getAllTags(posts).reduce(
			(acc, t) => acc.set(t, (acc.get(t) || 0) + 1),
			new Map<string, number>()
		)
	].sort((a, b) => b[1] - a[1])
}
