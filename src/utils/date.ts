import { siteConfig } from '@/site-config'

const dateFormat = new Intl.DateTimeFormat(siteConfig.date.locale, siteConfig.date.options)

export function getFormattedDate(
	date: string | number | Date,
	options?: Intl.DateTimeFormatOptions
) {
	if (typeof options !== 'undefined') {
		return new Date(date).toLocaleDateString(siteConfig.date.locale, {
			...(siteConfig.date.options as Intl.DateTimeFormatOptions),
			...options
		})
	}

	return dateFormat.format(new Date(date))
}

// YYYY-MM-DD from the date's own calendar fields. Frontmatter dates ("4 March 2026") parse at
// local midnight, so `toISOString()` would print the previous day on a machine east of UTC.
export function isoDate(date: Date) {
	const pad = (n: number) => String(n).padStart(2, '0')
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}
