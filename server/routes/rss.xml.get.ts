import type { ContentCollectionItem } from '@nuxt/content'
import { formatRFC7231 } from 'date-fns'
import { XMLBuilder } from 'fast-xml-parser'
import blogConfig from '~~/blog.config'
import { renderContentToHtml } from '../utils/render-content-to-html'
import { version } from '~~/package.json'

const runtimeConfig = useRuntimeConfig()

const builder = new XMLBuilder({
	attributeNamePrefix: '@_',
	cdataPropName: '#cdata',
	format: true,
	ignoreAttributes: false,
})

function toUrl(path?: string) {
	return new URL(path || '', blogConfig.url).toString()
}

function toRfcDate(input?: string) {
	return input ? formatRFC7231(new Date(input)) : undefined
}

export default defineEventHandler(async (event) => {
	setHeader(event, 'Content-Type', 'application/rss+xml; charset=utf-8')

	const disallowRules = blogConfig.article.robotsNotIndex ?? []
	const blockers = disallowRules.map((pattern) => {
		const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&')
		const regex = escaped.replace(/\\\*/g, '.*')
		return new RegExp(`^${regex}$`)
	})

	const shouldExclude = (path: string) => blockers.some(rule => rule.test(path))

	const posts = await queryCollection(event, 'content')
		.where('stem', 'LIKE', 'posts/%')
		.select('path', 'title', 'updated', 'author', 'description', 'categories', 'published', 'date', 'body', 'draft')
		.order('updated', 'DESC')
		.limit(blogConfig.feed.limit)
		.all()

	const items = posts
		.filter(post => !post.draft && post.path && !shouldExclude(post.path))
		.map((post: ContentCollectionItem) => {
			const link = toUrl(post.path)
			const html = renderContentToHtml(post.body) || ''

			return {
				title: post.title ?? '',
				link,
				guid: { '@_isPermaLink': true, '#text': link },
				category: post.categories?.[0],
				description: post.description || '',
				pubDate: toRfcDate(post.published || post.date || post.updated) || formatRFC7231(new Date()),
				'content:encoded': { '#cdata': html },
				...(post.updated ? { lastBuildDate: toRfcDate(post.updated) } : {}),
				author: post.author || blogConfig.author.email || blogConfig.author.name,
			}
		})

	const channel = {
		title: blogConfig.title,
		link: blogConfig.url,
		description: blogConfig.description,
		language: blogConfig.language,
		lastBuildDate: formatRFC7231(new Date(runtimeConfig.public.buildTime)),
		generator: `Zhilu Blog ${version}`,
		webMaster: blogConfig.author.email,
		'atom:link': {
			'@_href': toUrl('/rss.xml'),
			'@_rel': 'self',
			'@_type': 'application/rss+xml',
		},
		item: items,
	}

	const rss = {
		'@_version': '2.0',
		'@_xmlns:atom': 'http://www.w3.org/2005/Atom',
		'@_xmlns:content': 'http://purl.org/rss/1.0/modules/content/',
		channel,
	}

	const payload = {
		'?xml': { '@_version': '1.0', '@_encoding': 'UTF-8' },
		rss,
	}

	return builder.build(payload)
})
