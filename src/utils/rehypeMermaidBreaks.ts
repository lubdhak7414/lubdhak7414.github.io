import type { Element, ElementContent, Root } from 'hast'
import { visit } from 'unist-util-visit'

/**
 * Line breaks in Mermaid labels (`<br/>`) sit inside an SVG foreignObject, where the serializer
 * writes them as `<br></br>`. The HTML parser reads `</br>` as a second `<br>`, so the label's
 * last line dropped below its box and out of sight. Each line becomes a block span instead,
 * which lays out exactly as Mermaid measured it.
 */
export function rehypeMermaidBreaks() {
	return (tree: Root) => {
		visit(tree, 'element', (node: Element) => {
			if (node.tagName !== 'foreignObject') return
			visit(node, 'element', (el: Element) => {
				if (!el.children.some((c) => c.type === 'element' && c.tagName === 'br')) return
				const lines: ElementContent[][] = [[]]
				for (const child of el.children) {
					if (child.type === 'element' && child.tagName === 'br') lines.push([])
					else lines[lines.length - 1].push(child)
				}
				el.children = lines.map((children) => ({
					type: 'element',
					tagName: 'span',
					properties: { style: 'display:block' },
					children
				}))
			})
		})
	}
}
