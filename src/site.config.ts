import type { SiteConfig } from '@/types'
import type { AstroExpressiveCodeOptions } from 'astro-expressive-code'

export const siteConfig: SiteConfig = {
	author: 'Safwan Usaid Lubdhak',
	url: 'https://saf1.me',
	title: 'Safwan Usaid Lubdhak',
	description: 'Software engineer - resume, projects, and blog',
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

// https://expressive-code.com/reference/configuration/
export const expressiveCodeOptions: AstroExpressiveCodeOptions = {
	// One dark, one light theme => https://expressive-code.com/guides/themes/#available-themes
	themes: ['dracula', 'github-light'],
	themeCssSelector(theme, { styleVariants }) {
		// If one dark and one light theme are available
		// generate theme CSS selectors compatible with cactus-theme dark mode switch
		if (styleVariants.length >= 2) {
			const baseTheme = styleVariants[0]?.theme
			const altTheme = styleVariants.find((v) => v.theme.type !== baseTheme?.type)?.theme
			if (theme === baseTheme || theme === altTheme) return `[data-theme='${theme.type}']`
		}
		// return default selector
		return `[data-theme="${theme.name}"]`
	},
	useThemedScrollbars: false,
	styleOverrides: {
		frames: {
			frameBoxShadowCssValue: 'none'
		},
		uiLineHeight: 'inherit',
		codeFontSize: '0.875rem',
		codeLineHeight: '1.7142857rem',
		borderRadius: '4px',
		codePaddingInline: '1rem',
		codeFontFamily:
			'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;'
	}
}
