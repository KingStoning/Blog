import { XMLBuilder } from 'fast-xml-parser'
import blogConfig from '~~/blog.config'
import { renderContentToHtml } from '../utils/render-content-to-html'

const runtimeConfig = useRuntimeConfig()

const builder = new XMLBuilder({
	attributeNamePrefix: '@_',
	cdataPropName: '#cdata',
	format: true,
	ignoreAttributes: false,
})

const staticPaths = ['/', '/archive', '/link', '/about']

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
	const isBlocked = (path: string) => blockers.some(rule => rule.test(path))

	const urls = new Map<string, {
		lastmod?: string
		body?: any
		nofollow?: boolean
	}>()

	for (const path of staticPaths) {
		urls.set(path, {
			lastmod: runtimeConfig.public.buildTime,
			nofollow: isBlocked(path),
		})
	}

	const documents = await queryCollection(event, 'content')
		.select('path', 'updated', 'date', 'draft', 'body')
		.all()

	for (const document of documents) {
		if (document.draft)
			continue

		const path = typeof document.path === 'string' ? document.path : undefined
		if (!path)
			continue

		urls.set(path, {
			lastmod: document.updated || document.date,
			body: document.body,
			nofollow: isBlocked(path),
		})
	}

	const urlset = {
		'@_xmlns': 'http://www.sitemaps.org/schemas/sitemap/0.9',
		'@_xmlns:content': 'http://purl.org/rss/1.0/modules/content/',
		'@_xmlns:xhtml': 'http://www.w3.org/1999/xhtml',
		url: Array.from(urls.entries()).map(([path, meta]) => ({
			loc: toAbsoluteUrl(path),
			...(meta.lastmod ? { lastmod: new Date(meta.lastmod).toISOString() } : {}),
			...(meta.body ? { 'content:encoded': { '#cdata': renderContentToHtml(meta.body) } } : {}),
			...(meta.nofollow ? { 'xhtml:link': { '@_rel': 'nofollow', '@_href': toAbsoluteUrl(path) } } : {}),
		})),
	}

	return builder.build({ urlset })
})
