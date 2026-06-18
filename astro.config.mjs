import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'
import { unified } from '@astrojs/markdown-remark'
import { remarkReadingTime } from './src/utils/remarkReadingTime.ts'
import remarkUnwrapImages from 'remark-unwrap-images'
import rehypeExternalLinks from 'rehype-external-links'
import expressiveCode from 'astro-expressive-code'
import { expressiveCodeOptions } from './src/site.config'
import icon from 'astro-icon'

// https://astro.build/config
export default defineConfig({
	site: 'https://saf1.me',
	integrations: [expressiveCode(expressiveCodeOptions), sitemap(), mdx(), icon()],
	vite: {
		plugins: [tailwindcss()]
	},
	markdown: {
		// Astro 6 deprecated top-level `remarkPlugins`/`rehypePlugins`/`remarkRehype`;
		// the plugins now live on a `unified()` processor. Integration-added plugins
		// (e.g. expressive-code's highlighter) are still merged in automatically.
		processor: unified({
			remarkPlugins: [remarkUnwrapImages, remarkReadingTime],
			rehypePlugins: [
				[
					rehypeExternalLinks,
					{
						target: '_blank',
						rel: ['nofollow', 'noopener', 'noreferrer']
					}
				]
			],
			remarkRehype: {
				footnoteLabelProperties: {
					className: ['']
				}
			}
		})
	},
	prefetch: true
})
