import type { Element, ElementContent, Root } from 'hast'
import { fromHtml } from 'hast-util-from-html'
import { toHtml } from 'hast-util-to-html'
import { visit } from 'unist-util-visit'
import { rehypeMathGlyphs } from './rehypeMathGlyphs'
import { rehypeMathSigns } from './rehypeMathSigns'

/**
 * Spacing that native MathML leaves to the browser and that Chromium and Firefox set
 * differently, written into the markup so both agree. Runs after rehypeMathSigns (which marks
 * function names with the class `op`).
 *
 * - Function names: a thin space before `ln`, `tanh`, `KL`… when an identifier, number,
 *   fraction or closing bracket comes right before it (`o tanh c`, `x ln y`, `) ln (`).
 * - Commas: no space before, 0.22em after, and no extra `\ ` after that; ellipses 0.17em each
 *   side; nothing before a closing bracket or a comma.
 * - Brackets: zero side bearing. `\left( … \right)` and `\big( … \big)` around content no taller
 *   than a line are drawn at text size, so they match plain `( … )`.
 * - Scripts: brackets and commas inside a sub- or superscript keep their own spacing (the CSS
 *   that tightens script operators skips them), a script that opens with `(` starts a thin space
 *   away from its base, and a script inside a script is marked so the CSS stops shrinking it.
 */

const THIN = '0.1667em'
const OPEN = new Set(['(', '[', '{', '⟨', '⌊', '⌈', '|', '‖'])
const CLOSE = new Set([')', ']', '}', '⟩', '⌋', '⌉', '|', '‖'])
const ELLIPSIS = new Set(['…', '⋯'])
const SCRIPTS = new Set(['msub', 'msup', 'msubsup'])
const TALL = new Set(['mfrac', 'mtable', 'msqrt', 'mroot', 'munderover'])

const els = (node: Element) => node.children.filter((c): c is Element => c.type === 'element')
const text = (node: Element): string =>
	node.children
		.map((c) => (c.type === 'text' ? c.value : c.type === 'element' ? text(c) : ''))
		.join('')
const classes = (node: Element) => {
	const c = node.properties?.className
	return Array.isArray(c) ? c.map(String) : []
}
const set = (node: Element, props: Record<string, string | string[]>) => {
	node.properties = { ...node.properties, ...props }
}
const mspace = (width: string): Element => ({
	type: 'element',
	tagName: 'mspace',
	properties: { width },
	children: []
})

/** Whitespace that is already a space: `\ `, `~`, `\,` (an mtext of spaces) or an mspace. */
const isGap = (n: ElementContent) =>
	n.type === 'element' &&
	(n.tagName === 'mspace' || (n.tagName === 'mtext' && !text(n).replace(/[⁡-⁤]/g, '').trim()))

const isMo = (n: ElementContent | undefined, set: Set<string>) =>
	n?.type === 'element' && n.tagName === 'mo' && set.has(text(n))

/** A function name, possibly scripted (`\log_2`) or wrapped (`\mathrm{KL}` as an mrow). */
function isName(n: ElementContent | undefined): boolean {
	if (n?.type !== 'element') return false
	if (n.tagName === 'mi') return classes(n).includes('op')
	if (n.tagName === 'mrow' || SCRIPTS.has(n.tagName)) {
		const kids = els(n)
		return n.tagName === 'mrow' ? kids.length === 1 && isName(kids[0]) : isName(kids[0])
	}
	return false
}

/** Something a name needs a thin space after: an identifier, number, fraction, script or `)`. */
function endsTerm(n: ElementContent | undefined): boolean {
	if (n?.type !== 'element') return false
	if (['mi', 'mn', 'mfrac', 'msqrt', 'mroot', 'mtext'].includes(n.tagName))
		return n.tagName !== 'mtext' || !!text(n).trim()
	if (SCRIPTS.has(n.tagName) || n.tagName === 'mover' || n.tagName === 'munder')
		return endsTerm(els(n)[0]) || isMo(els(n)[0], CLOSE)
	if (n.tagName === 'mrow') return endsTerm(els(n).at(-1)) || isMo(els(n).at(-1), CLOSE)
	if (n.tagName === 'mo') return CLOSE.has(text(n)) && n.properties?.form !== 'prefix'
	return false
}

/** Is anything in these nodes taller than a line of text? */
function tall(nodes: ElementContent[]): boolean {
	return nodes.some(
		(n) =>
			n.type === 'element' &&
			(TALL.has(n.tagName) ||
				(n.tagName === 'munder' && n.properties?.accentunder === undefined) ||
				(n.tagName === 'mover' && n.properties?.accent === undefined) ||
				(n.tagName === 'mo' && n.properties?.minsize !== undefined && !OPEN.has(text(n))) ||
				tall(n.children))
	)
}

/** Draw a bracket at text size with no side bearing. */
function flatten(mo: Element) {
	const p = { ...mo.properties }
	delete p.minsize
	delete p.maxsize
	delete p.minSize
	delete p.maxSize
	mo.properties = { ...p, stretchy: 'false', lspace: '0em', rspace: '0em' }
}

function fences(row: Element) {
	const kids = row.children
	// `\left( … \right)`: an mrow whose first and last children are the fences.
	const first = kids.find((n) => n.type === 'element')
	const last = [...kids].reverse().find((n) => n.type === 'element')
	if (
		first?.type === 'element' &&
		last?.type === 'element' &&
		first !== last &&
		first.properties?.fence === 'true' &&
		isMo(first, OPEN) &&
		isMo(last, CLOSE)
	) {
		const inner = kids.slice(kids.indexOf(first) + 1, kids.indexOf(last))
		if (!tall(inner)) [first, last].forEach(flatten)
		else [first, last].forEach((m) => set(m, { lspace: '0em', rspace: '0em' }))
	}
	// `\big( … \big)`: sized brackets among their siblings.
	for (let i = 0; i < kids.length; i++) {
		const open = kids[i]
		if (open.type !== 'element' || !isMo(open, OPEN) || open.properties?.minsize === undefined)
			continue
		let depth = 0
		for (let j = i + 1; j < kids.length; j++) {
			const k = kids[j]
			if (k.type !== 'element' || k.tagName !== 'mo' || k.properties?.minsize === undefined)
				continue
			if (OPEN.has(text(k)) && !CLOSE.has(text(k))) depth++
			else if (CLOSE.has(text(k))) {
				if (depth--) continue
				if (!tall(kids.slice(i + 1, j))) [open, k].forEach(flatten)
				else [open, k].forEach((m) => set(m, { lspace: '0em', rspace: '0em' }))
				break
			}
		}
	}
	// A big operator straight after an opening bracket, (Σ…): no space between them.
	for (let i = 1; i < kids.length; i++) {
		const k = kids[i]
		if (k.type !== 'element' || !isMo(kids[i - 1], OPEN)) continue
		const core =
			k.tagName === 'mo'
				? k
				: SCRIPTS.has(k.tagName) || k.tagName === 'munderover' || k.tagName === 'munder'
					? els(k)[0]
					: undefined
		if (core?.tagName === 'mo' && ['∑', '∏', '∫'].includes(text(core))) set(core, { lspace: '0em' })
	}
	// Plain brackets: no side bearing (a bracket is never spaced like an operator).
	for (const k of kids) {
		if (k.type !== 'element' || k.tagName !== 'mo') continue
		const t = text(k)
		if ((OPEN.has(t) || CLOSE.has(t)) && k.properties?.stretchy === 'false' && t !== '|')
			set(k, { lspace: '0em', rspace: '0em' })
	}
}

function punctuation(row: Element) {
	const kids = row.children
	for (let i = 0; i < kids.length; i++) {
		const k = kids[i]
		if (k.type !== 'element' || k.tagName !== 'mo') continue
		const t = text(k)
		if (t === ',' || t === ';') {
			// `,\ ` in the source: the comma's own space is enough.
			while (i + 1 < kids.length && isGap(kids[i + 1])) kids.splice(i + 1, 1)
			const next = kids[i + 1]
			set(k, { lspace: '0em', rspace: next && !isMo(next, CLOSE) ? '0.22em' : '0em' })
		} else if (ELLIPSIS.has(t)) {
			// KaTeX puts a thin mtext after `\dots` before a closing bracket.
			while (i + 1 < kids.length && isGap(kids[i + 1]) && isMo(kids[i + 2], CLOSE))
				kids.splice(i + 1, 1)
			const prev = kids[i - 1]
			const next = kids[i + 1]
			set(k, {
				lspace: prev && !isMo(prev, new Set([',', ...OPEN])) ? '0.17em' : '0em',
				rspace: next && !isMo(next, new Set([',', ...CLOSE])) ? '0.17em' : '0em'
			})
		}
	}
}

/** KaTeX writes `\!` as a thin space (U+2009 U+2063), which draws as a gap: make it negative. */
function negativeSpace(row: Element) {
	row.children.forEach((k, i) => {
		if (k.type === 'element' && k.tagName === 'mtext' && text(k) === '\u2009\u2063')
			row.children[i] = mspace('-0.1667em')
	})
}

/** Opens with a bracket: `(`, or an mrow such as `\left(`. */
const opensBracket = (n: ElementContent | undefined): boolean =>
	isMo(n, OPEN) || (n?.type === 'element' && n.tagName === 'mrow' && isMo(els(n)[0], OPEN))

function names(row: Element) {
	const kids = row.children
	for (let i = 0; i < kids.length; i++) {
		const k = kids[i]
		if (!isName(k)) continue
		// No space between a name and its bracket, even when the source has `\exp\!\Big(`.
		const apply = kids[i + 1]
		if (isMo(apply, new Set(['\u2061'])) && apply?.type === 'element') {
			let j = i + 2
			while (j < kids.length && isGap(kids[j])) j++
			if (opensBracket(kids[j])) {
				const p = { ...apply.properties }
				delete p.rspace
				apply.properties = p
				kids.splice(i + 2, j - (i + 2))
			}
		}
		let j = i - 1
		while (j >= 0 && kids[j].type !== 'element') j--
		const prev = kids[j]
		if (j >= 0 && !isGap(prev) && endsTerm(prev)) {
			kids.splice(i, 0, mspace(THIN))
			i++
		}
	}
}

/** A sub- or superscript: tag the script so CSS can tell it apart, and pad an opening bracket. */
function scripts(el: Element, depth: number) {
	if (!SCRIPTS.has(el.tagName)) return
	for (const script of els(el).slice(1)) {
		const lead = script.tagName === 'mrow' ? els(script)[0] : script
		if (script.tagName === 'mrow' && isMo(lead, OPEN)) script.children.unshift(mspace('0.1em'))
		if (depth > 0) set(script, { className: [...classes(script), 'script2'] })
	}
}

const ROWS = new Set(['math', 'mrow', 'mstyle', 'mpadded', 'menclose', 'msqrt', 'mtd', 'semantics'])

/**
 * `\underbrace`: Chromium stretched the brace glyph to part of its base and off centre. Draw it
 * as a bracket under the whole base in CSS instead (`.ubrace` in app.css); the label stays
 * centred under it.
 */
function underbrace(el: Element) {
	el.children.forEach((k, i) => {
		if (k.type !== 'element' || k.tagName !== 'munder') return
		const [base, brace] = els(k)
		if (!base || !isMo(brace, new Set(['⏟']))) return
		el.children[i] = {
			type: 'element',
			tagName: 'mrow',
			properties: { className: ['ubrace'] },
			children: [base]
		}
	})
}

/** In a script, a bracket right after a scripted letter (q_phi(z|x)) starts a thin space away. */
function scriptBracket(row: Element) {
	const kids = row.children
	for (let i = 1; i < kids.length; i++) {
		const prev = kids[i - 1]
		if (!isMo(kids[i], OPEN) || prev.type !== 'element' || !SCRIPTS.has(prev.tagName)) continue
		kids.splice(i, 0, mspace('0.08em'))
		i++
	}
}

function walk(el: Element, depth: number) {
	underbrace(el)
	if (depth > 0 && el.tagName === 'mrow') scriptBracket(el)
	if (ROWS.has(el.tagName)) {
		negativeSpace(el)
		fences(el)
		punctuation(el)
		names(el)
		italicF(el)
	}
	scripts(el, depth)
	els(el).forEach((c, i) => {
		const inScript = SCRIPTS.has(el.tagName) && i > 0
		walk(c, depth + (inScript ? 1 : 0))
	})
}

/**
 * An italic f runs into a bracket after it (f(z)): a small space between them, in place of any
 * space the source put there (`f\!\left(` pulled it closer still).
 */
function italicF(row: Element) {
	const kids = row.children
	for (let i = 0; i < kids.length - 1; i++) {
		const k = kids[i]
		if (k.type !== 'element' || k.tagName !== 'mi' || text(k) !== 'f') continue
		if (k.properties?.mathvariant === 'normal' || classes(k).includes('op')) continue
		let j = i + 1
		while (j < kids.length && isGap(kids[j])) j++
		if (!opensBracket(kids[j])) continue
		kids.splice(i + 1, j - (i + 1), mspace('0.06em'))
		i++
	}
}

const RELATIONS = new Set(['=', '<', '>', '≈', '≤', '≥', '≠', '→', '∝', '≡'])
/** Letters whose italic tail reaches far left of the stroke you see, so a space before them reads wide. */
const LEANING = new Set(['f', 'j', 'y', 'J'])

/** The row a formula's terms sit in: math > semantics > mrow, or the lone token itself. */
function topRow(math: Element): Element {
	let el = math
	for (;;) {
		const kids = els(el).filter((k) => k.tagName !== 'annotation')
		if (kids.length === 1 && (kids[0].tagName === 'semantics' || kids[0].tagName === 'mrow'))
			el = kids[0]
		else return el
	}
}

/**
 * Whole-formula spacing that depends on where the maths sits.
 *
 * - Inline maths that is one operator (`$\odot$` in a sentence): no operator space, the words'
 *   own spaces are enough.
 * - Inline maths that opens with a relation: a long formula split in two for phones
 *   (`$a=b(1-b)$ $=c$`) has a word space before the `=`, so the `=` drops its own.
 * - Inline maths that opens with an italic f, j, y or J: those lean so far right that the word
 *   space before them read double; pull the letter back a little.
 * - A display line that opens with `+`, or with `−` before a term that is not a number, carries
 *   on the line above (`+KL(…)`): space the sign as the binary operator it is.
 */
function formula(math: Element) {
	const row = topRow(math)
	const kids = els(row)
	const first = kids[0]
	if (!first) return
	const display = math.properties?.display === 'block'
	if (!display) {
		if (kids.length === 1 && first.tagName === 'mo') {
			set(first, { lspace: '0em', rspace: '0em' })
			return
		}
		if (first.tagName === 'mo' && RELATIONS.has(text(first))) set(first, { lspace: '0em' })
		if (first.tagName === 'mi' && LEANING.has(text(first)) && !classes(first).includes('op')) {
			const at = row.children.indexOf(first)
			if (at >= 0) row.children.splice(at, 0, mspace('-0.07em'))
		}
		return
	}
	if (first.tagName !== 'mo' || kids.length < 2) return
	const sign = text(first)
	if (sign !== '+' && !(sign === '−' && kids[1].tagName !== 'mn')) return
	const p = { ...first.properties }
	delete p.form
	first.properties = { ...p, lspace: '0.2222em', rspace: '0.2222em' }
	const at = row.children.indexOf(first)
	while (at + 1 < row.children.length && isGap(row.children[at + 1])) row.children.splice(at + 1, 1)
}

export function rehypeMathSpacing() {
	return (tree: Root) => {
		visit(tree, 'element', (node: Element) => {
			if (node.tagName !== 'math') return
			walk(node, 0)
			formula(node)
			return 'skip'
		})
	}
}

/**
 * The whole math pass (signs, glyphs, spacing) on a KaTeX MathML string, for maths rendered
 * outside the Markdown pipeline (the takeaways that remarkBrief lifts into the gist box).
 */
export function mathHtml(html: string): string {
	const tree = fromHtml(html, { fragment: true })
	rehypeMathSigns()(tree)
	rehypeMathGlyphs()(tree)
	rehypeMathSpacing()(tree)
	return toHtml(tree)
}

/** Punctuation that must not start a line after inline maths. */
export const TIE = /^[,.;:!?)\]’”%]/

/**
 * Keep inline maths and the one punctuation mark right after it on the same line: on a phone
 * the comma after `$z$` could wrap to the start of the next line on its own. Only that one
 * character joins the maths, so a long formula can still move to a line of its own.
 */
export function rehypeMathTie() {
	return (tree: Root) => {
		visit(tree, 'element', (node: Element) => {
			if (node.tagName === 'math' || classes(node).includes('math-tie')) return 'skip'
			const kids = node.children
			for (let i = 0; i < kids.length - 1; i++) {
				const k = kids[i]
				const next = kids[i + 1]
				if (k.type !== 'element' || k.tagName !== 'span' || !classes(k).includes('katex')) continue
				if (next.type !== 'text' || !TIE.test(next.value)) continue
				if (els(k).some((m) => m.properties?.display === 'block')) continue
				const ch = next.value[0]
				next.value = next.value.slice(1)
				kids[i] = {
					type: 'element',
					tagName: 'span',
					properties: { className: ['math-tie'] },
					children: [k, { type: 'text', value: ch }]
				}
				if (!next.value) kids.splice(i + 1, 1)
			}
		})
	}
}
