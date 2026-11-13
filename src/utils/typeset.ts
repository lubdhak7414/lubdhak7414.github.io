/** A quote after one of these (or at the start) opens; after anything else it closes. */
const OPENS_AFTER = /[\s([{<\u2013\u2014/\u201c\u2018-]/

/**
 * Straight quotes to curly ones, judged by the character before each quote, never the one after:
 * a quote that follows a space, the start, an opening bracket, a dash or another opening quote
 * opens, anything else closes. `before` is the character in front of `text` (the end of the
 * previous run of text, or a letter standing in for inline code or maths), '' at the start.
 * An apostrophe after a space in front of a digit ('90s) is a closing one.
 */
export function curlQuotes(text: string, before = ''): string {
	let out = ''
	let prev = before
	for (let i = 0; i < text.length; i++) {
		const ch = text[i]!
		const opens = !prev || OPENS_AFTER.test(prev)
		let put = ch
		if (ch === '"') put = opens ? '“' : '”'
		else if (ch === "'") put = opens && !/\d/.test(text[i + 1] ?? '') ? '‘' : '’'
		out += put
		prev = put
	}
	return out
}

interface MdNode {
	type: string
	value?: string
	children?: MdNode[]
}

/** Blocks whose children are one run of inline text. */
const RUNS = new Set(['paragraph', 'heading', 'tableCell'])
/** Inline nodes that print as a word: a quote right after one closes. */
const WORDLIKE = new Set(['inlineCode', 'inlineMath', 'image', 'imageReference'])
/** Blocks left alone: code, display maths, raw HTML, frontmatter. */
const SKIP = new Set(['code', 'math', 'html', 'yaml', 'toml'])

/**
 * Curly quotes for the Markdown body (smartypants runs with quotes off, astro.config.mjs). Each
 * paragraph, heading and table cell is read as one run, so a quote next to inline maths, inline
 * code, a link or bold text is judged by the character really in front of it. Smartypants skipped
 * maths and judged by the character after the quote, so `"$z$ near 0"` opened with a closing one.
 */
export function remarkQuotes() {
	const run = (nodes: MdNode[], state: { prev: string }) => {
		for (const node of nodes) {
			if (node.type === 'text' && typeof node.value === 'string') {
				node.value = curlQuotes(node.value, state.prev)
				if (node.value) state.prev = node.value.at(-1)!
			} else if (WORDLIKE.has(node.type)) state.prev = 'A'
			else if (node.type === 'break') state.prev = '\n'
			else if (node.children) run(node.children, state)
		}
	}
	const walk = (node: MdNode) => {
		if (SKIP.has(node.type) || !node.children) return
		if (RUNS.has(node.type)) run(node.children, { prev: '' })
		else node.children.forEach(walk)
	}
	return (tree: MdNode) => walk(tree)
}

/**
 * Titles and summaries made ready for the page: curly quotes and apostrophes (the Markdown body
 * gets them from `remarkQuotes`, so titles match it), no line break at a hyphen inside a word
 * ("hand-written", "8-bit"), and a one-letter word ("a", "I") kept on the line of the word after
 * it. Rendering only: the frontmatter, the head and the feeds keep the plain text.
 */
export function typeset(text: string): string {
	return curlQuotes(text)
		.replace(/(\p{L}|\d)-(?=\p{L}|\d)/gu, '$1‑')
		.replace(/(^|\s)([aAI]) /g, '$1$2 ')
}

/**
 * Inline code (rendered HTML) that never breaks mid-identifier: short code stays on one line,
 * and longer code may break only at a space or after a slash (never at a hyphen or a dot
 * inside a name like sleep.target). Code inside
 * `<pre>` carries markup, so the plain `<code>text</code>` match leaves it alone. A piece too
 * long for a phone line (over 28 characters) keeps the column's break-anywhere fallback.
 */
export function keepCode(html: string): string {
	return html.replace(/<code>([^<]+)<\/code>/g, (whole, text: string) => {
		const pieces = text.split(/(?<=[/ ])(?=[^/ ])/)
		const glue = (piece: string) =>
			piece.replace(/&[a-z#0-9]+;/gi, 'x').length > 28 ? piece : `<span class="nb">${piece}</span>`
		if (pieces.length === 1) {
			return text.replace(/&[a-z#0-9]+;/gi, 'x').length > 28
				? whole
				: `<code class="nb">${text}</code>`
		}
		return `<code>${pieces.map(glue).join('<wbr>')}</code>`
	})
}

/** Small words a cut summary should not end on ("with no…", "for a…"). */
const DANGLING = /\s+(?:a|an|and|as|at|by|for|from|in|into|no|of|on|or|the|to|with)$/i

/**
 * A summary cut to about `max` characters for a narrow row, at a sentence end where one falls
 * late enough (kept whole, no ellipsis), else at a clause break (comma, colon, semicolon), else at
 * a word; trailing punctuation and dangling small words go before one "…". Text that fits is
 * returned unchanged.
 */
export function shorten(text: string, max = 104): string {
	if (text.length <= max) return text
	const head = text.slice(0, max + 1)
	const sentence = head.lastIndexOf('. ')
	if (sentence >= max / 2) return head.slice(0, sentence + 1)
	const clause = Math.max(head.lastIndexOf(', '), head.lastIndexOf(': '), head.lastIndexOf('; '))
	let cut = head.slice(0, clause >= max / 2 ? clause : head.lastIndexOf(' '))
	for (let before = ''; before !== cut; ) {
		before = cut
		cut = cut.replace(/[\s,;:.\u2013\u2014-]+$/, '').replace(DANGLING, '')
	}
	return `${cut}…`
}
