import type { Element, Root } from 'hast'
import { visit } from 'unist-util-visit'

/**
 * Two MathML details Chromium draws wrong, rewritten in a form both engines agree on:
 *
 * - Styled letters. MathML Core supports only `mathvariant="normal"`, so Chromium printed
 *   `\mathbf x`, `\boldsymbol\mu`, `\mathbb E` and `\mathcal N` as plain italic letters. Each is
 *   swapped for its Unicode mathematical alphanumeric character (𝐱, 𝝁, 𝔼, 𝒩), which the math
 *   font carries and which Firefox draws the same way.
 * - Hats. KaTeX writes `\widehat` with an ASCII caret, which Chromium set as a large ^ floating
 *   above the letter. The combining circumflex (U+0302) is the accent the font stretches.
 */

const LATIN_UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const LATIN_LOWER = 'abcdefghijklmnopqrstuvwxyz'
// The order of the Unicode math Greek blocks: ϴ takes the slot of the missing capital final sigma.
const GREEK_UPPER = 'ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡϴΣΤΥΦΧΨΩ'
const GREEK_LOWER = 'αβγδεζηθικλμνξοπρςστυφχψω∂ϵϑϰϕϱϖ'
const DIGITS = '0123456789'

interface Style {
	upper?: number
	lower?: number
	greekUpper?: number
	greekLower?: number
	digits?: number
	/** Letters that Unicode encodes elsewhere (the Letterlike Symbols block). */
	holes?: Record<string, number>
}

const STYLES: Record<string, Style> = {
	bold: {
		upper: 0x1d400,
		lower: 0x1d41a,
		greekUpper: 0x1d6a8,
		greekLower: 0x1d6c2,
		digits: 0x1d7ce
	},
	'bold-italic': { upper: 0x1d468, lower: 0x1d482, greekUpper: 0x1d71c, greekLower: 0x1d736 },
	'double-struck': {
		upper: 0x1d538,
		lower: 0x1d552,
		digits: 0x1d7d8,
		holes: { C: 0x2102, H: 0x210d, N: 0x2115, P: 0x2119, Q: 0x211a, R: 0x211d, Z: 0x2124 }
	},
	script: {
		upper: 0x1d49c,
		lower: 0x1d4b6,
		holes: {
			B: 0x212c,
			E: 0x2130,
			F: 0x2131,
			H: 0x210b,
			I: 0x2110,
			L: 0x2112,
			M: 0x2133,
			R: 0x211b,
			e: 0x212f,
			g: 0x210a,
			o: 0x2134
		}
	}
}

function mapChar(ch: string, style: Style): string | undefined {
	if (style.holes?.[ch]) return String.fromCodePoint(style.holes[ch])
	const tables: [string, number | undefined][] = [
		[LATIN_UPPER, style.upper],
		[LATIN_LOWER, style.lower],
		[GREEK_UPPER, style.greekUpper],
		[GREEK_LOWER, style.greekLower],
		[DIGITS, style.digits]
	]
	for (const [chars, base] of tables) {
		const i = chars.indexOf(ch)
		if (i >= 0 && base !== undefined) return String.fromCodePoint(base + i)
	}
	return undefined
}

const TOKENS = new Set(['mi', 'mn', 'mo'])

export function rehypeMathGlyphs() {
	return (tree: Root) => {
		visit(tree, 'element', (node: Element) => {
			if (node.tagName !== 'math') return
			visit(node, 'element', (el: Element) => {
				const variant = el.properties?.mathVariant ?? el.properties?.mathvariant
				if (TOKENS.has(el.tagName) && typeof variant === 'string' && STYLES[variant]) {
					const texts = el.children.filter((c) => c.type === 'text')
					if (texts.length !== el.children.length) return
					const mapped = texts.map((t) => [...t.value].map((ch) => mapChar(ch, STYLES[variant])))
					if (mapped.some((chars) => chars.some((c) => c === undefined))) return
					texts.forEach((t, i) => (t.value = mapped[i].join('')))
					delete el.properties.mathVariant
					delete el.properties.mathvariant
				}
				// Norm bars: KaTeX writes \| and \lVert as U+2225, which Chromium spaces as a relation
				// (a gap each side). U+2016 is the fence, set tight in both engines.
				if (el.tagName === 'mo' && el.children.length === 1) {
					const t = el.children[0]
					if (t.type === 'text' && t.value === '∥') {
						t.value = '\u2016'
						el.properties = { ...el.properties, lspace: '0em', rspace: '0em' }
					}
				}
				if (el.tagName === 'mover' && el.properties?.accent !== undefined) {
					const accent = el.children.filter((c) => c.type === 'element').at(-1)
					if (accent?.type === 'element' && accent.tagName === 'mo') {
						const t = accent.children[0]
						if (accent.children.length === 1 && t.type === 'text' && t.value === '^') {
							t.value = '\u0302'
						}
					}
				}
			})
		})
	}
}
