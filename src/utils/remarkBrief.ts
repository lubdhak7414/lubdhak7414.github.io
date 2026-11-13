import type { Root, RootContent, PhrasingContent, ListItem } from 'mdast'
import type { VFile } from 'vfile'
import { toString } from 'mdast-util-to-string'
import katex from 'katex'
import { mathHtml, TIE } from './rehypeMathSpacing'

/**
 * Lifts a write-up's summary pieces out of the body so the layout can print them where a
 * skimmer looks first (the "gist" under the title):
 *
 * - `takeaways`: the "Key Takeaways" blockquote's bullets, as inline HTML.
 * - `figures`: every image in the body ({ url, alt, section }), left in place. The one image a
 *   project names as its `shot` leaves the body: the layout prints it under the gist.
 *
 * The text is the author's own; this only moves it. The RSS feed renders the raw Markdown, so
 * it keeps the takeaways where they were written.
 */

export interface BriefFigure {
	url: string
	alt: string
	section: string | null
}

const escape = (s: string) =>
	s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function inline(nodes: PhrasingContent[]): string {
	// Characters already printed with the maths before them (see rehypeMathTie).
	const tied = new Set<PhrasingContent>()
	return nodes
		.map((node, i) => {
			// remark-math's inline node: keep the maths (native MathML), not the raw LaTeX.
			if ((node.type as string) === 'inlineMath') {
				const { value } = node as unknown as { value: string }
				const math = mathHtml(
					katex.renderToString(value, { output: 'mathml', throwOnError: false })
				)
				const next = nodes[i + 1]
				if (next?.type !== 'text' || !TIE.test(next.value)) return math
				tied.add(next)
				return `<span class="math-tie">${math}${escape(next.value[0])}</span>`
			}
			switch (node.type) {
				case 'text':
					return escape(tied.has(node) ? node.value.slice(1) : node.value)
				case 'strong':
					return `<strong>${inline(node.children)}</strong>`
				case 'emphasis':
					return `<em>${inline(node.children)}</em>`
				case 'delete':
					return `<del>${inline(node.children)}</del>`
				case 'inlineCode':
					return `<code>${escape(node.value)}</code>`
				case 'break':
					return '<br>'
				case 'link': {
					const ext = /^https?:/.test(node.url)
						? ' target="_blank" rel="nofollow noopener noreferrer"'
						: ''
					return `<a href="${escape(node.url)}"${ext}>${inline(node.children)}</a>`
				}
				default:
					return escape(toString(node))
			}
		})
		.join('')
}

/** The phrasing content of a list item (its paragraphs, joined). */
function itemPhrasing(item: ListItem): PhrasingContent[] {
	return item.children.flatMap((child, i) =>
		child.type === 'paragraph'
			? [...(i > 0 ? [{ type: 'text', value: ' ' } as PhrasingContent] : []), ...child.children]
			: []
	)
}

const isTakeaways = (node: RootContent) =>
	node.type === 'blockquote' &&
	node.children[0]?.type === 'paragraph' &&
	/^key takeaways:?$/i.test(toString(node.children[0]).trim())

export function remarkBrief() {
	return function (tree: Root, file: VFile) {
		let takeaways: string[] = []
		const figures: BriefFigure[] = []

		const kids = tree.children
		const qi = kids.findIndex(isTakeaways)
		if (qi !== -1) {
			const quote = kids[qi] as Extract<RootContent, { type: 'blockquote' }>
			const list = quote.children.find((c) => c.type === 'list')
			if (list && list.type === 'list') {
				takeaways = list.children.map((item) => inline(itemPhrasing(item)))
				kids.splice(qi, 1)
			}
		}

		const fm = (file.data as { astro: { frontmatter: Record<string, unknown> } }).astro.frontmatter
		const shot = (fm.shot as { src?: unknown } | undefined)?.src
		if (typeof shot === 'string') {
			const isShot = (n: RootContent) =>
				(n.type === 'image' && n.url === shot) ||
				(n.type === 'paragraph' &&
					n.children.length === 1 &&
					n.children[0]?.type === 'image' &&
					n.children[0].url === shot)
			const at = kids.findIndex(isShot)
			if (at !== -1) kids.splice(at, 1)
		}

		// Images, with the h2 they sit under (matched to a heading slug by the layout).
		let section: string | null = null
		for (const node of kids) {
			if (node.type === 'heading' && node.depth === 2) section = toString(node)
			const visit = (n: RootContent) => {
				if (n.type === 'image') figures.push({ url: n.url, alt: n.alt ?? '', section })
				if ('children' in n) (n.children as RootContent[]).forEach(visit)
			}
			visit(node)
		}

		fm.takeaways = takeaways
		fm.figures = figures
	}
}
