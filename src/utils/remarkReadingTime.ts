import type { Root } from 'mdast'
import type { VFile } from 'vfile'
import getReadingTime from 'reading-time'
import { toString } from 'mdast-util-to-string'

export function remarkReadingTime() {
	return function (tree: Root, file: VFile) {
		const textOnPage = toString(tree)
		const readingTime = getReadingTime(textOnPage)
		const astroData = file.data as { astro: { frontmatter: Record<string, string> } }
		astroData.astro.frontmatter.minutesRead = readingTime.text
	}
}
