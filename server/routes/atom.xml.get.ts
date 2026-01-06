import type { ContentCollectionItem } from '@nuxt/content'
import { formatISO } from 'date-fns'
import { XMLBuilder } from 'fast-xml-parser'
import blogConfig from '~~/blog.config'
import { renderContentToHtml } from '../utils/render-content-to-html'
import { version } from '~~/package.json'

const runtimeConfig = useRuntimeConfig()

const builder = new XMLBuilder({
	attributeNamePrefix: '$',
	cdataPropName: '$',
	format: true,
	ignoreAttributes: false,
	textNodeName: '_',
})

function formatIsoDate(date?: string) {
	return date ? formatISO(new Date(date)) : undefined
}

function getUrl(path: string | undefined) {
	return new URL(path ?? '', blogConfig.url).toString()
}

function renderContent(post: ContentCollectionItem) {
	return renderContentToHtml(post.body) || ''
}

export default defineEventHandler(async (event) => {
	const posts = await queryCollection(event, 'content')
		.where('stem', 'LIKE', 'posts/%')
		.select('path', 'title', 'updated', 'author', 'description', 'categories', 'published', 'date', 'image', 'body')
		.order('updated', 'DESC')
		.limit(blogConfig.feed.limit)
		.all()

	const entries = posts.map(post => ({
		id: getUrl(post.path),
		title: post.title ?? '',
		updated: formatIsoDate(post.updated),
		author: { name: post.author || blogConfig.author.name },
		content: {
			$type: 'html',
			$: renderContent(post),
		},
		link: { $href: getUrl(post.path) },
		summary: post.description,
		category: { $term: post.categories?.[0] },
		published: formatIsoDate(post.published) ?? formatIsoDate(post.date),
	}))

	const feed = {
		$xmlns: 'http://www.w3.org/2005/Atom',
		id: blogConfig.url,
		title: blogConfig.title,
		updated: runtimeConfig.public.buildTime,
		description: blogConfig.description, // RSS 2.0
		author: {
			name: blogConfig.author.name,
			email: blogConfig.author.email,
			uri: blogConfig.author.homepage,
		},
		link: [
			{ $href: getUrl('atom.xml'), $rel: 'self' },
			{ $href: blogConfig.url, $rel: 'alternate' },
		],
		language: blogConfig.language, // RSS 2.0
		generator: {
			$uri: 'https://github.com/L33Z22L11/blog-v3',
			$version: version,
			_: 'Zhilu Blog',
		},
		icon: blogConfig.favicon,
		logo: blogConfig.author.avatar, // Ratio should be 2:1
		rights: `© ${new Date().getFullYear()} ${blogConfig.author.name}`,
		subtitle: blogConfig.subtitle || blogConfig.description,
		entry: entries,
	}

	return builder.build({
		'?xml': { $version: '1.0', $encoding: 'UTF-8' },
		'?xml-stylesheet': blogConfig.feed.enableStyle ? { $type: 'text/xsl', $href: '/assets/atom.xsl' } : undefined,
		feed,
	})
})
