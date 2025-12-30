import { XMLBuilder } from 'fast-xml-parser'
import blogConfig from '~~/blog.config'

const runtimeConfig = useRuntimeConfig()

const builder = new XMLBuilder({
	attributeNamePrefix: '@_',
	format: true,
	ignoreAttributes: false,
})

const staticPaths = ['/', '/archive', '/link']

function toAbsoluteUrl(path: string) {
	return new URL(path, blogConfig.url).toString()
}

function patternToRegExp(pattern: string) {
	const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&')
	const regex = escaped.replace(/\\\*/g, '.*')
	return new RegExp(`^${regex}$`)
}

export default defineEventHandler(async (event) => {
	setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')

	const disallowRules = blogConfig.article.robotsNotIndex ?? []
	const blockers = disallowRules.map(patternToRegExp)
	const shouldExclude = (path: string) => blockers.some(rule => rule.test(path))

	const urls = new Map<string, string | undefined>()

	for (const path of staticPaths) {
		if (!shouldExclude(path))
			urls.set(path, runtimeConfig.public.buildTime)
	}

	const documents = await queryCollection(event, 'content')
		.select('path', 'updated', 'date', 'draft')
		.all()

	for (const document of documents) {
		if (document.draft)
			continue

		const path = typeof document.path === 'string' ? document.path : undefined
		if (!path || shouldExclude(path))
			continue

		urls.set(path, document.updated || document.date)
	}

	const urlset = {
		'@_xmlns': 'http://www.sitemaps.org/schemas/sitemap/0.9',
		url: Array.from(urls.entries()).map(([path, lastmod]) => ({
			loc: toAbsoluteUrl(path),
			...(lastmod ? { lastmod: new Date(lastmod).toISOString() } : {}),
		})),
	}

	return builder.build({ urlset })
})
