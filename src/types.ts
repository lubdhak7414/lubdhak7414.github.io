export type SiteConfig = {
	author: string
	// Canonical site origin (no trailing slash). Single source of truth for the
	// origin — also used as `site` in astro.config.mjs and as the base for schema.
	url: string
	title: string
	description: string
	// Third-person author bio (sentence fragment). Reused by JSON-LD, the author
	// box, and the homepage description so the wording can't drift.
	bio: string
	socials: {
		github: string
		linkedin: string
		email: string
	}
	lang: string
	ogLocale: string
	date: {
		locale: string | string[] | undefined
		options: Intl.DateTimeFormatOptions
	}
}

export type PaginationLink = {
	url: string
	text?: string
	srLabel?: string
}

export type SiteMeta = {
	title: string
	description?: string
	ogImage?: string | undefined
	ogImageWidth?: number | undefined
	ogImageHeight?: number | undefined
	publishDate?: string | undefined
	modifiedDate?: string | undefined
	noIndex?: boolean | undefined
}
