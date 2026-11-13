import type { Element, Root } from 'hast'
import { visit } from 'unist-util-visit'

/** Rows whose children are laid out side by side, where an operator's form is inferred. */
const ROWS = new Set(['math', 'mrow', 'mstyle', 'mpadded', 'mphantom', 'menclose', 'msqrt', 'mtd'])
/** Operators after which a sign still binds to the term on its right: they end nothing. */
const CLOSERS = new Set([')', ']', '}', '⟩', '⌋', '⌉', '|', '‖', '∥', '′', '″', '!', '%'])
const SIGNS = new Set(['−', '-', '+', '±', '∓'])

const text = (node: Element) =>
	node.children.map((c) => (c.type === 'text' ? c.value : '')).join('')

/** An upright single letter, as `\mathrm{softmax}` spells a name: one `mi` per letter. */
const isRomanLetter = (n: Element['children'][number]): n is Element =>
	n.type === 'element' &&
	n.tagName === 'mi' &&
	n.properties?.mathvariant === 'normal' &&
	/^[A-Za-z]$/.test(text(n))

/** A function name (`\tanh`, `\max`, `\mathrm{softmax}`) is set in the text face at text size. */
function markName(el: Element) {
	if (!/^[A-Za-z]{2,}$/.test(text(el))) return
	const cls = el.properties?.className
	const list = Array.isArray(cls) ? cls.map(String) : []
	if (!list.includes('op')) el.properties = { ...el.properties, className: [...list, 'op'] }
}

/** Join a run of two or more upright letters into one name, so it reads and sizes as a word. */
function mergeLetters(row: Element) {
	const kids = row.children
	for (let i = 0; i < kids.length; i++) {
		let j = i
		while (j < kids.length && isRomanLetter(kids[j])) j++
		if (j - i < 2) continue
		const word = kids
			.slice(i, j)
			.map((k) => text(k as Element))
			.join('')
		const name: Element = {
			type: 'element',
			tagName: 'mi',
			properties: { className: ['op'] },
			children: [{ type: 'text', value: word }]
		}
		kids.splice(i, j - i, name)
	}
}

/**
 * `\tanh z` needs a thin space between name and argument, as TeX sets it; `\tanh(z)` does not.
 * KaTeX puts an invisible function-application operator there, which native MathML draws with
 * no space, so `tanh z` ran together as `tanhz`.
 */
function spaceAfterName(apply: Element, rest: Element['children']) {
	const next = rest.find((n): n is Element => n.type === 'element')
	if (!next) return
	const first =
		next.tagName === 'mrow' ? next.children.find((n): n is Element => n.type === 'element') : next
	if (first?.tagName === 'mo') return
	apply.properties = { ...apply.properties, rspace: '0.1667em' }
}

/**
 * Native MathML infers an operator's form from its place in the row: only the first child is a
 * prefix, so the minus in `w = -0.4` or `(-0.1)` is spaced like a subtraction. KaTeX's MathML
 * leaves that to the browser. Mark a sign as a tight prefix when nothing comes before it in its
 * row, or when an operator, relation, opening bracket or comma does. A hyphen-minus that reaches
 * a number or operator token is printed as the real minus sign, U+2212. Function names get the
 * class `op` (styled in app.css), with `\mathrm{...}` letters joined into one name first.
 * Runs after rehype-katex.
 */
export function rehypeMathSigns() {
	return (tree: Root) => {
		visit(tree, 'element', (node: Element) => {
			if (node.tagName !== 'math') return
			visit(node, 'element', (el: Element, index, parent) => {
				if (el.tagName === 'mi') {
					markName(el)
					return
				}
				if (ROWS.has(el.tagName)) mergeLetters(el)
				if (el.tagName === 'mn' || el.tagName === 'mo') {
					for (const c of el.children) {
						if (c.type === 'text' && c.value.includes('-')) c.value = c.value.replace(/-/g, '−')
					}
				}
				if (el.tagName !== 'mo' || !parent || index === undefined) return
				if (parent.type !== 'element' || !ROWS.has(parent.tagName)) return
				if (text(el) === '\u2061') {
					spaceAfterName(el, parent.children.slice(index + 1))
					return
				}
				if (!SIGNS.has(text(el))) return
				let prev: Element | undefined
				for (let i = index - 1; i >= 0; i--) {
					const sib = parent.children[i]
					if (sib.type !== 'element' || sib.tagName === 'mspace') continue
					// `\ ` and `~` arrive as an mtext holding a no-break space
					if (sib.tagName === 'mtext' && !text(sib).trim()) continue
					prev = sib
					break
				}
				const unary = !prev || (prev.tagName === 'mo' && !CLOSERS.has(text(prev)))
				if (!unary) return
				el.properties = { ...el.properties, form: 'prefix', lspace: '0em', rspace: '0em' }
			})
		})
	}
}
