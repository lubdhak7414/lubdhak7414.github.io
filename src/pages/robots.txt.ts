import { siteConfig } from '@/site-config'

export const prerender = true

export async function GET() {
	const content =
		[
			'User-agent: *',
			'Allow: /',
			'',
			`Sitemap: ${new URL('/sitemap-index.xml', siteConfig.url).href}`
		].join('\n') + '\n'

	return new Response(content, {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' }
	})
}
