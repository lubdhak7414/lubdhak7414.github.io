import type { SiteConfig } from '@/types'
import type { AstroExpressiveCodeOptions } from 'astro-expressive-code'

export const siteConfig: SiteConfig = {
	author: 'Safwan Usaid Lubdhak',
	url: 'https://saf1.me',
	title: 'Safwan Usaid Lubdhak',
	description: 'Software engineer - resume, projects, and blog',
	// Shown under the name in the identity rail (home + about).
	role: 'Software Developer',
	location: 'Bangladesh',
	bio: 'Recent CS graduate from Bangladesh, trying my hand at software development. Currently focusing on web apps, DevOps, and AI systems, while occasionally tinkering with open-source Linux tools.',
	socials: {
		github: 'https://github.com/lubdhak7414',
		linkedin: 'https://www.linkedin.com/in/lubdhak7414/',
		email: 'hello@saf1.me'
	},
	// HTML lang attribute, applied in src/layouts/BaseLayout.astro
	lang: 'en-GB',
	// og:locale meta, emitted in src/components/BaseHead.astro
	ogLocale: 'en_GB',
	// Date.prototype.toLocaleDateString() parameters, used in src/utils/date.ts
	date: {
		locale: 'en-GB',
		options: {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		}
	}
}

// Code-block theme for the "Atelier Monograph" design: ink on the raised paper tone,
// pine keywords, pine-2 types, umber strings (the only place umber is used), faint
// comments. Same values as the tokens in src/styles/app.css.
const atelierCodeTheme = {
	name: 'atelier-monograph',
	type: 'light' as const,
	colors: {
		'editor.background': '#FAF8F5',
		'editor.foreground': '#18181B',
		'editor.selectionBackground': '#E4E2DC',
		'editorLineNumber.foreground': '#6A6A73',
		'terminal.background': '#FAF8F5',
		focusBorder: '#1B4D3E'
	},
	settings: [
		{ settings: { foreground: '#18181B', background: '#FAF8F5' } },
		{
			scope: ['comment', 'punctuation.definition.comment', 'string.comment'],
			settings: { foreground: '#6A6A73' }
		},
		{
			scope: [
				'keyword',
				'storage',
				'storage.type',
				'storage.modifier',
				'constant.language',
				'variable.language',
				'entity.name.tag',
				'support.function.builtin'
			],
			settings: { foreground: '#1B4D3E' }
		},
		{
			scope: ['string', 'punctuation.definition.string', 'string.template', 'markup.inline.raw'],
			settings: { foreground: '#8A5A36' }
		},
		{
			scope: [
				'entity.name.type',
				'entity.name.class',
				'entity.other.inherited-class',
				'support.type',
				'support.class',
				'entity.other.attribute-name'
			],
			settings: { foreground: '#2D5A43' }
		}
	]
}

// https://expressive-code.com/reference/configuration/
export const expressiveCodeOptions: AstroExpressiveCodeOptions = {
	themes: [atelierCodeTheme],
	// The theme's comment/string colours (faint, umber) pass WCAG AA (>= 4.5:1) on the
	// raised background; EC's default 5.5 floor would recolour them away from the tokens.
	minSyntaxHighlightingColorContrast: 4.5,
	useThemedScrollbars: false,
	styleOverrides: {
		borderRadius: '0',
		borderColor: '#E4E2DC',
		codeFontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
		codeFontSize: '13px',
		codeLineHeight: '1.65',
		codePaddingBlock: '1rem',
		codePaddingInline: '1rem',
		uiFontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
		uiFontSize: '12px',
		uiLineHeight: '1.5',
		frames: {
			frameBoxShadowCssValue: 'none',
			shadowColor: 'transparent',
			editorTabBarBackground: '#FAF8F5',
			editorActiveTabBackground: '#FAF8F5',
			editorActiveTabForeground: '#52525B',
			editorActiveTabIndicatorTopColor: 'transparent',
			editorActiveTabIndicatorBottomColor: 'transparent',
			editorTabBarBorderBottomColor: '#E4E2DC',
			terminalBackground: '#FAF8F5',
			terminalTitlebarBackground: '#FAF8F5',
			terminalTitlebarForeground: '#52525B',
			terminalTitlebarDotsOpacity: '0',
			terminalTitlebarBorderBottomColor: '#E4E2DC'
		}
	}
}
