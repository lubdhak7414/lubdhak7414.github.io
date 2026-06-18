import rss from '@astrojs/rss'
import MarkdownIt from 'markdown-it'
import sanitizeHtml from 'sanitize-html'
import { siteConfig } from '@/site-config'
import { getAllPosts } from '@/utils'

const parser = new MarkdownIt()

export const GET = async () => {
	const posts = await getAllPosts()
	const sortedPosts = posts.toSorted(
		(a, b) => new Date(b.data.publishDate).valueOf() - new Date(a.data.publishDate).valueOf()
	)

	return rss({
		title: siteConfig.title,
		description: siteConfig.description,
		site: import.meta.env.SITE,
		customData: `<language>${siteConfig.lang}</language>`,
		items: sortedPosts.map((post) => ({
			title: post.data.title,
			description: post.data.description,
			pubDate: post.data.publishDate,
			link: `/blog/${post.id}/`,
			// Full article body as HTML. Body images use relative (`./`) paths that
			// only resolve through Astro's image pipeline on-site, so strip <img> from
			// the feed rather than ship links that 404 in readers.
			content: sanitizeHtml(parser.render(post.body ?? ''), {
				allowedTags: sanitizeHtml.defaults.allowedTags.filter((tag) => tag !== 'img')
			})
		}))
	})
}
