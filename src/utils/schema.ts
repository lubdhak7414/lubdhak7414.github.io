import { siteConfig } from '@/site-config'

// Canonical site origin - single source of truth lives in site.config.ts (and is
// also used as `site` in astro.config.mjs), so a domain change updates the `@id`,
// canonical URLs, and entity consolidation in one place.
const ORIGIN = siteConfig.url

// Canonical author/entity identifier. The full `Person` object is emitted on the
// homepage and /about (the entity hub) sharing this `@id`, so Google treats them
// as one entity; every other page (blog posts) references the entity by `@id`
// only, avoiding duplicate structured data across the site.
export const PERSON_ID = `${ORIGIN}/#person`

const [givenName, ...rest] = siteConfig.author.split(' ')
const familyName = rest.at(-1) ?? ''

export const personSchema = {
	'@context': 'https://schema.org',
	'@type': 'Person',
	'@id': PERSON_ID,
	name: siteConfig.author,
	givenName,
	familyName,
	alternateName: ['Safwan Lubdhak', 'Safwan U. Lubdhak'],
	url: ORIGIN,
	mainEntityOfPage: `${ORIGIN}/about/`,
	email: `mailto:${siteConfig.socials.email}`,
	jobTitle: 'Software Developer',
	description: siteConfig.bio,
	knowsAbout: ['Software Development', 'KDE', 'Linux', 'Web Development', 'Databases', 'DevOps'],
	publishingPrinciples: `${ORIGIN}/about/`,
	address: {
		'@type': 'PostalAddress',
		addressCountry: 'Bangladesh'
	},
	sameAs: [siteConfig.socials.github, siteConfig.socials.linkedin]
}

export const websiteSchema = {
	'@context': 'https://schema.org',
	'@type': 'WebSite',
	name: siteConfig.author,
	url: ORIGIN,
	publisher: { '@id': PERSON_ID },
	copyrightHolder: { '@id': PERSON_ID },
	copyrightYear: new Date().getFullYear()
}
