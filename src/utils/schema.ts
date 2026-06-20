// Canonical author/entity identifier. The full `Person` object is emitted on the
// homepage and /about (the entity hub) sharing this `@id`, so Google treats them
// as one entity; every other page (blog posts) references the entity by `@id`
// only, avoiding duplicate structured data across the site.
export const PERSON_ID = 'https://saf1.me/#person'

export const personSchema = {
	'@context': 'https://schema.org',
	'@type': 'Person',
	'@id': PERSON_ID,
	name: 'Safwan Usaid Lubdhak',
	alternateName: ['Safwan Lubdhak', 'Safwan U. Lubdhak'],
	url: 'https://saf1.me',
	mainEntityOfPage: 'https://saf1.me/about/',
	email: 'mailto:hello@saf1.me',
	jobTitle: 'Software Developer',
	description:
		'Software developer and open-source contributor from Bangladesh, building KDE/Linux desktop tools, AI systems, and web applications.',
	knowsAbout: [
		'Software Development',
		'KDE',
		'Linux',
		'Web Development',
		'Databases',
		'DevOps'
	],
	address: {
		'@type': 'PostalAddress',
		addressCountry: 'Bangladesh'
	},
	sameAs: ['https://github.com/lubdhak7414', 'https://www.linkedin.com/in/lubdhak7414/']
}

export const websiteSchema = {
	'@context': 'https://schema.org',
	'@type': 'WebSite',
	name: 'Safwan Usaid Lubdhak',
	url: 'https://saf1.me',
	publisher: { '@id': PERSON_ID }
}
