import type { MarkdownHeading } from 'astro'

export interface TocItem extends MarkdownHeading {
	subheadings: Array<TocItem>
}

function diveChildren(item: TocItem, depth: number): Array<TocItem> {
	if (depth === 1 || !item.subheadings.length) {
		return item.subheadings
	} else {
		// e.g., 2
		return diveChildren(item.subheadings[item.subheadings.length - 1] as TocItem, depth - 1)
	}
}

export function generateToc(headings: ReadonlyArray<MarkdownHeading>) {
	// this ignores/filters out h1 element(s)
	const bodyHeadings = [...headings.filter(({ depth }) => depth > 1)]
	const toc: Array<TocItem> = []

	bodyHeadings.forEach((h) => {
		const heading: TocItem = { ...h, subheadings: [] }

		// add h2 elements into the top level
		if (heading.depth === 2) {
			toc.push(heading)
		} else {
			const lastItemInToc = toc[toc.length - 1]
			// No shallower parent to nest under — e.g. an h3+ before any h2, or a
			// heading shallower-or-equal to the last top-level entry. Promote it to
			// the top level instead of crashing the build or mis-nesting siblings.
			if (!lastItemInToc || heading.depth <= lastItemInToc.depth) {
				toc.push(heading)
				return
			}

			// higher depth
			// push into children, or children's children
			const gap = heading.depth - lastItemInToc.depth
			const target = diveChildren(lastItemInToc, gap)
			target.push(heading)
		}
	})
	return toc
}
