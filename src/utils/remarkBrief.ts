import type { Root, RootContent, PhrasingContent, ListItem } from 'mdast'
import type { VFile } from 'vfile'
import { toString } from 'mdast-util-to-string'

/**
 * Lifts a write-up's summary pieces out of the body so the layout can print them where a
 * skimmer looks first (the "gist" under the title) and last (the skills before "Next"):
 *
 * - `takeaways`: the "Key Takeaways" blockquote's bullets, as inline HTML.
 * - `skills`: the "Skills & Deliverables" list ({ term, html }), with its heading and the
 *   rule before it.
 * - `figures`: every image in the body ({ url, alt, section }), left in place; case studies
 *   use them for the gallery under the gist. The one image a case study names as its `shot`
 *   leaves the body: the gallery already shows it big, a screen above.
 *
 * The text is the author's own; this only moves it. The RSS feed renders the raw Markdown, so
 * it keeps both blocks where they were written.
 */

export interface BriefSkill {
	term: string
	html: string
}
export interface BriefFigure {
	url: string
	alt: string
	section: string | null
}

const escape = (s: string) =>
	s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function inline(nodes: PhrasingContent[]): string {
	return nodes
		.map((node) => {
			switch (node.type) {
				case 'text':
					return escape(node.value)
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

const isSkillsHeading = (node: RootContent) =>
	node.type === 'heading' && /^skills\s*(&|and)\s*deliverables/i.test(toString(node).trim())

export function remarkBrief() {
	return function (tree: Root, file: VFile) {
		let takeaways: string[] = []
		let skills: BriefSkill[] = []
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

		const si = kids.findIndex(isSkillsHeading)
		const list = si !== -1 ? kids[si + 1] : undefined
		if (list && list.type === 'list') {
			skills = list.children.map((item) => {
				const phr = itemPhrasing(item)
				const [first, ...rest] = phr
				if (first?.type !== 'strong') return { term: '', html: inline(phr) }
				const term = toString(first)
					.replace(/[:.]\s*$/, '')
					.trim()
				// "**Term**: what it covered" -> drop the separator left at the start of the rest.
				const head = rest[0]
				if (head?.type === 'text') head.value = head.value.replace(/^\s*[:.\-–]\s*/, '')
				return { term, html: inline(rest) }
			})
			const start = kids[si - 1]?.type === 'thematicBreak' ? si - 1 : si
			kids.splice(start, si + 2 - start)
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
		fm.skills = skills
		fm.figures = figures
	}
}
