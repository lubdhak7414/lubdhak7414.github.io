import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'
import { unified } from '@astrojs/markdown-remark'
import { remarkReadingTime } from './src/utils/remarkReadingTime.ts'
import { remarkBrief } from './src/utils/remarkBrief.ts'
import remarkUnwrapImages from 'remark-unwrap-images'
import rehypeExternalLinks from 'rehype-external-links'
import expressiveCode from 'astro-expressive-code'
import { siteConfig, expressiveCodeOptions } from './src/site.config'
import icon from 'astro-icon'

// Build guard: `public/_redirects` is copied verbatim and bypasses Astro's
// routing, so an internal 301 target (e.g. a tag hub) that stops building after a
// post is deleted silently becomes a redirect-to-404. Assert every internal,
// non-splat target resolves to a built page; fail the build if one doesn't.
function validateRedirectTargets() {
	return {
		name: 'validate-redirect-targets',
		hooks: {
			'astro:build:done': ({ dir, logger }) => {
				const redirectsFile = new URL('_redirects', dir)
				if (!existsSync(fileURLToPath(redirectsFile))) return
				const missing = new Set()
				for (const line of readFileSync(redirectsFile, 'utf-8').split('\n')) {
					const trimmed = line.trim()
					if (!trimmed || trimmed.startsWith('#')) continue
					const target = trimmed.split(/\s+/)[1]
					if (!target || !target.startsWith('/') || target.includes(':splat')) continue
					const page = new URL(`.${target.replace(/\/$/, '')}/index.html`, dir)
					if (!existsSync(fileURLToPath(page))) missing.add(target)
				}
				if (missing.size) {
					throw new Error(
						`_redirects points at targets with no built page: ${[...missing].join(', ')}. ` +
							`Update the redirect or restore the destination page.`
					)
				}
				logger.info('All internal _redirects targets resolve to built pages.')
			}
		}
	}
}

// Project write-ups that moved from /blog/ to /projects/. Cloudflare Pages serves real
// 301s for these from public/_redirects; this list makes Astro also emit meta-refresh
// pages at the old URLs for hosts that ignore _redirects (the GitHub Pages backup).
const movedToProjects = [
	'pacioli',
	'circular-alt-tab',
	'kdoit-kde-todo',
	'chiptune-sfx-maestro',
	'php-no-framework',
	'fun-ai-experiments',
	'green-bangla-foundation',
	'ni-driving-test-routes'
]

// https://astro.build/config
export default defineConfig({
	site: siteConfig.url,
	// Start loading a page when its link is hovered or focused, so the click lands on a page
	// that is already there. First-party script, no third parties.
	prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
	redirects: {
		...Object.fromEntries(movedToProjects.map((slug) => [`/blog/${slug}/`, `/projects/${slug}/`])),
		'/blog/2/': '/blog/'
	},
	integrations: [
		expressiveCode(expressiveCodeOptions),
		sitemap(),
		mdx(),
		icon(),
		validateRedirectTargets()
	],
	vite: {
		plugins: [tailwindcss()]
	},
	markdown: {
		// Astro 6 deprecated top-level `remarkPlugins`/`rehypePlugins`/`remarkRehype`;
		// the plugins now live on a `unified()` processor. Integration-added plugins
		// (e.g. expressive-code's highlighter) are still merged in automatically.
		processor: unified({
			remarkPlugins: [remarkUnwrapImages, remarkReadingTime, remarkBrief],
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
