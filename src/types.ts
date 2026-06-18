export type SiteConfig = {
	author: string
	title: string
	description: string
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
