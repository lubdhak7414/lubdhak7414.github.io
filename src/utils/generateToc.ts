import type { MarkdownHeading } from 'astro'

// The TOC sidebar surfaces top-level (h2) sections only - h3+ sub-items bloat it
// (the caller in TOC.astro made that decision). So this flattens to the h2
// headings; no nesting tree is built.
export function generateToc(headings: ReadonlyArray<MarkdownHeading>) {
	return headings.filter(({ depth }) => depth === 2)
}
