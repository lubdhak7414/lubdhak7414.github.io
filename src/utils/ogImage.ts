import { getImage } from 'astro:assets'
import type { ImageMetadata } from 'astro'

// Open Graph / Twitter preview images must avoid WebP (Astro's default output):
// some link-preview crawlers — notably LinkedIn — render WebP unreliably and drop
// the share thumbnail. PNG suits the flat default card; JPEG (q80) keeps
// photographic post covers small. Single source for this policy so any page that
// emits its own OG image inherits it instead of re-deriving the format rule.
export async function getCrawlerSafeOgImage(src: ImageMetadata, format: 'png' | 'jpeg' = 'png') {
	const processed =
		format === 'jpeg'
			? await getImage({ src, format, quality: 80 })
			: await getImage({ src, format })
	return { src: processed.src, width: src.width, height: src.height }
}
