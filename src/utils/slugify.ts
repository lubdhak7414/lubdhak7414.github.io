/**
 * Convert a tag into a URL-safe slug (spaces → hyphens, etc.).
 * Tags are already lowercased + deduped by the content schema, but we lowercase
 * again defensively so the slug is stable regardless of caller.
 */
export function slugifyTag(tag: string): string {
	return tag
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
}
