import { getAllPosts, sortMDByDate } from '@/utils'
import { siteConfig } from '@/site-config'

export const prerender = true

export async function GET() {
	const posts = await getAllPosts()
	const latestPosts = sortMDByDate(posts).slice(0, 10)

	const lines = [
		`# ${siteConfig.title}`,
		'',
		`> ${siteConfig.description}`,
		'',
		`Website: ${siteConfig.url}`,
		...(latestPosts.length > 0
			? [
					'',
					'## Recent posts',
					...latestPosts.map((post) => {
						const title = post.data.title
							.replace(/\[/g, '\\[')
							.replace(/\]/g, '\\]')
							.replace(/\(/g, '\\(')
							.replace(/\)/g, '\\)')
							.replace(/`/g, '\\`')
							.replace(/\*/g, '\\*')
						return `- [${title}](${new URL(`/blog/${post.id}/`, siteConfig.url).href})`
					})
				]
			: []),
		'',
		'## Resources',
		`- Blog: ${new URL('/blog/', siteConfig.url).href}`,
		`- About: ${new URL('/about/', siteConfig.url).href}`,
		`- RSS: ${new URL('/rss.xml', siteConfig.url).href}`
	]

	return new Response(lines.join('\n') + '\n', {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8'
		}
	})
}
