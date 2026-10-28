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
	bio: 'Full stack developer at Metaora and recent CS graduate. Builds web apps and small Linux tools, and works on DevOps.',
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

// Code-block theme for the "Breeze desk" design: Kate's Breeze Light syntax colours on
// the --raised grey, adjusted so every token clears WCAG AA (>= 4.5:1) on #F7F8F9.
// Background, text and line colours match the tokens in src/styles/app.css.
const breezeDeskCodeTheme = {
	name: 'breeze-desk',
	type: 'light' as const,
	colors: {
		'editor.background': '#F7F8F9',
		'editor.foreground': '#232629',
		'editor.selectionBackground': '#DADDE1',
		'editorLineNumber.foreground': '#646A70',
		'terminal.background': '#F7F8F9',
		focusBorder: '#1A6AA6'
	},
	settings: [
		{ settings: { foreground: '#232629', background: '#F7F8F9' } },
		{
			scope: ['comment', 'punctuation.definition.comment', 'string.comment'],
			settings: { foreground: '#6B6A68' }
		},
		{
			scope: ['keyword', 'storage', 'storage.type', 'storage.modifier', 'variable.language'],
			settings: { foreground: '#1F1C1B', fontStyle: 'bold' }
		},
		{
			scope: ['string', 'punctuation.definition.string', 'string.template', 'markup.inline.raw'],
			settings: { foreground: '#B30000' }
		},
		{
			scope: [
				'entity.name.type',
				'entity.name.class',
				'entity.other.inherited-class',
				'support.type',
				'support.class',
				'entity.name.tag'
			],
			settings: { foreground: '#0057AE' }
		},
		{
			scope: ['entity.name.function', 'support.function', 'entity.other.attribute-name'],
			settings: { foreground: '#644A9B' }
		},
		{
			scope: ['constant.numeric', 'constant.language'],
			settings: { foreground: '#875F00' }
		}
	]
}

// https://expressive-code.com/reference/configuration/
export const expressiveCodeOptions: AstroExpressiveCodeOptions = {
	themes: [breezeDeskCodeTheme],
	// Every token colour passes WCAG AA (>= 4.5:1) on the code background; EC's default
	// 5.5 floor would recolour the comment and number colours away from the theme.
	minSyntaxHighlightingColorContrast: 4.5,
	useThemedScrollbars: false,
	styleOverrides: {
		borderRadius: '4px',
		borderColor: '#E4E6E9',
		codeFontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
		codeFontSize: '14px',
		codeLineHeight: '1.65',
		codePaddingBlock: '1rem',
		codePaddingInline: '1rem',
		uiFontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
		uiFontSize: '13px',
		uiLineHeight: '1.5',
		frames: {
			frameBoxShadowCssValue: 'none',
			shadowColor: 'transparent',
			editorTabBarBackground: '#F7F8F9',
			editorActiveTabBackground: '#F7F8F9',
			editorActiveTabForeground: '#4A4F55',
			editorActiveTabIndicatorTopColor: 'transparent',
			editorActiveTabIndicatorBottomColor: 'transparent',
			editorTabBarBorderBottomColor: '#DADDE1',
			terminalBackground: '#F7F8F9',
			terminalTitlebarBackground: '#F7F8F9',
			terminalTitlebarForeground: '#4A4F55',
			terminalTitlebarDotsOpacity: '0',
			terminalTitlebarBorderBottomColor: '#DADDE1'
		}
	}
}
