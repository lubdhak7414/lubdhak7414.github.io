import rss from '@astrojs/rss'
import { siteConfig } from '@/site-config'
import { getAllPosts } from '@/utils'

export const GET = async () => {
	const posts = await getAllPosts()
	const sortedPosts = posts.sort(
		(a, b) => new Date(b.data.publishDate).valueOf() - new Date(a.data.publishDate).valueOf()
	)

	return rss({
		title: siteConfig.title,
		description: siteConfig.description,
		site: import.meta.env.SITE,
		items: sortedPosts.map((post) => ({
			title: post.data.title,
			description: post.data.description,
			pubDate: post.data.publishDate,
			link: `/blog/${post.id}/`
		}))
	})
}
