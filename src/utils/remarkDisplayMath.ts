import type { Root } from 'mdast'
import type { VFile } from 'vfile'
import { visit } from 'unist-util-visit'

/**
 * remark-math reads a one-line `$$ ... $$` as INLINE math, but notes write display formulas
 * that way, on a line of their own. Turn a paragraph that is only a `$$...$$` span into display
 * math. Must run after remark-math.
 */
export function remarkDisplayMath() {
	return (tree: Root, file: VFile) => {
		const src = String(file.value)
		visit(tree, 'paragraph', (node, index, parent) => {
			const only = node.children.length === 1 ? node.children[0] : undefined
			if (!only || only.type !== 'inlineMath' || !parent || index === undefined) return
			const at = only.position?.start.offset
			if (at === undefined || !src.startsWith('$$', at)) return
			parent.children[index] = {
				type: 'math',
				value: only.value,
				data: {
					hName: 'pre',
					hChildren: [
						{
							type: 'element',
							tagName: 'code',
							properties: { className: ['language-math', 'math-display'] },
							children: [{ type: 'text', value: only.value }]
						}
					]
				}
			} as never
		})
	}
}
