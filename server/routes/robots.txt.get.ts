import blogConfig from '~~/blog.config'

const sitemapUrl = new URL('/sitemap.xml', blogConfig.url).toString()
const allowList = ['/', '/archive', '/link']
const disallowList = blogConfig.article.robotsNotIndex ?? []

export default defineEventHandler((event) => {
	setHeader(event, 'Content-Type', 'text/plain; charset=utf-8')

	const lines = [
		'User-agent: *',
		...allowList.map(path => `Allow: ${path}`),
		...disallowList.map(path => `Disallow: ${path}`),
		`Sitemap: ${sitemapUrl}`,
	]

	return `${lines.join('\n')}\n`
})
