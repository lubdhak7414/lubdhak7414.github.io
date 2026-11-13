import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'
import { unified } from '@astrojs/markdown-remark'
import { remarkReadingTime } from './src/utils/remarkReadingTime.ts'
import { remarkBrief } from './src/utils/remarkBrief.ts'
import { remarkQuotes } from './src/utils/typeset.ts'
import remarkUnwrapImages from 'remark-unwrap-images'
import rehypeExternalLinks from 'rehype-external-links'
import remarkMath from 'remark-math'
import { remarkDisplayMath } from './src/utils/remarkDisplayMath.ts'
import rehypeKatex from 'rehype-katex'
import { rehypeMathSigns } from './src/utils/rehypeMathSigns.ts'
import { rehypeMathGlyphs } from './src/utils/rehypeMathGlyphs.ts'
import { rehypeMathSpacing, rehypeMathTie } from './src/utils/rehypeMathSpacing.ts'
import rehypeMermaid from 'rehype-mermaid'
import { rehypeMermaidBreaks } from './src/utils/rehypeMermaidBreaks.ts'
import { readdirSync } from 'node:fs'
import { homedir } from 'node:os'

// TEMPORARY series preview: playwright 1.64 wants a newer Chromium than the one cached locally,
// so point rehype-mermaid at the cached headless shell (undefined = playwright's own).
function cachedChrome() {
	try {
		const root = `${homedir()}/.cache/ms-playwright`
		const dir = readdirSync(root).find((d) => d.startsWith('chromium_headless_shell'))
		const sub = readdirSync(`${root}/${dir}`).find((d) => d.startsWith('chrome-headless-shell'))
		return `${root}/${dir}/${sub}/chrome-headless-shell`
	} catch {
		return undefined
	}
}
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
	// Load a page as soon as its link scrolls into view, so the click lands on a page that is
	// already there. Phones have no hover, so 'hover' never fired there. Pages are a few KB, and
	// Astro skips prefetching on data saver and slow connections. First-party script only.
	prefetch: { prefetchAll: true, defaultStrategy: 'viewport' },
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
			// Smartypants keeps dashes and ellipses; quotes come from remarkQuotes, which judges each
			// quote by the character before it, inline maths and code included.
			smartypants: { quotes: false },
			remarkPlugins: [
				remarkUnwrapImages,
				remarkMath,
				remarkDisplayMath,
				remarkQuotes,
				remarkReadingTime,
				remarkBrief
			],
			rehypePlugins: [
				// Math at build time as MathML: no CSS, fonts or client script.
				[rehypeKatex, { output: 'mathml' }],
				// Unary minus signs: tight prefix operators, not subtractions.
				rehypeMathSigns,
				// Bold, blackboard and script letters and hats as Unicode both engines draw.
				rehypeMathGlyphs,
				// Function-name, comma, bracket and script spacing; punctuation kept with its maths.
				rehypeMathSpacing,
				rehypeMathTie,
				// Mermaid blocks become static inline SVG at build time (headless Chromium, no client JS).
				[
					rehypeMermaid,
					{
						strategy: 'inline-svg',
						launchOptions: { executablePath: cachedChrome() },
						// The site's tokens, Plex at 16px (the page's font, so labels measure the
						// same as they draw) and tight spacing so a diagram fits a phone column
						// with its text at 11px or more.
						mermaidConfig: {
							theme: 'base',
							fontFamily: 'IBM Plex Sans, sans-serif',
							themeVariables: {
								fontFamily: 'IBM Plex Sans, sans-serif',
								fontSize: '16px',
								background: '#ffffff',
								primaryColor: '#f5f6f7',
								primaryTextColor: '#15171a',
								primaryBorderColor: '#c9cdd2',
								lineColor: '#565c66',
								textColor: '#15171a',
								edgeLabelBackground: '#ffffff'
							},
							flowchart: { nodeSpacing: 28, rankSpacing: 36, padding: 12, wrappingWidth: 180 }
						}
					}
				],
				rehypeMermaidBreaks,
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
	}
})
