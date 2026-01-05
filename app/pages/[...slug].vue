<script setup lang="ts">
const route = useRoute()
const appConfig = useAppConfig()

const layoutStore = useLayoutStore()
layoutStore.setAside(['toc'])

const { data: post } = await useAsyncData(
	() => route.path,
	() => queryCollection('content').path(route.path).first(),
)

const contentStore = useContentStore()
const { toc, meta } = storeToRefs(contentStore)

function extractText(content: unknown): string {
	if (!content)
		return ''
	if (typeof content === 'string')
		return content
	if (Array.isArray(content))
		return content.map(extractText).join(' ')
	if (typeof content === 'object' && 'children' in (content as any))
		return extractText((content as any).children)
	if (typeof content === 'object' && 'value' in (content as any))
		return String((content as any).value)
	return ''
}

const metaDescription = computed(() => {
	if (!post.value)
		return ''
	const description = post.value.description?.trim()
	if (description)
		return description
	const excerptText = typeof post.value.excerpt === 'string' ? post.value.excerpt.trim() : ''
	if (excerptText)
		return excerptText
	const bodyExcerpt = typeof post.value.body?.excerpt === 'string' ? post.value.body.excerpt.trim() : ''
	if (bodyExcerpt)
		return bodyExcerpt
	const bodyText = extractText(post.value.body?.children).trim()
	return bodyText ? bodyText.slice(0, 160) : ''
})

const excerpt = computed(() => metaDescription.value)

const isPreviewPath = computed(() => route.path.startsWith('/previews/'))
const publishedTime = computed(() => post.value?.published || post.value?.date)
const modifiedTime = computed(() => post.value?.updated || publishedTime.value)
const articleUrl = computed(() => (post.value?.path ? new URL(post.value.path, appConfig.url).toString() : ''))
const shouldNoIndex = computed(() => Boolean(post.value?.draft) || isPreviewPath.value)
const siteName = computed(() => appConfig.title || appConfig.author?.name)

function setTocAndMeta() {
	toc.value = post.value?.body.toc
	meta.value = post.value?.meta
}

setTocAndMeta()

const articleSchema = computed(() => post.value && !shouldNoIndex.value
	? {
		'@context': 'https://schema.org',
		'@type': ['Article', 'BlogPosting'],
		headline: post.value.title,
		name: post.value.title,
		description: metaDescription.value,
		image: post.value.image ? [post.value.image] : undefined,
		author: {
			'@type': 'Person',
			name: appConfig.author?.name,
			url: appConfig.author?.homepage,
		},
		datePublished: publishedTime.value,
		dateModified: modifiedTime.value,
		url: articleUrl.value,
		mainEntityOfPage: articleUrl.value,
		keywords: post.value.tags,
		articleSection: post.value.categories?.[0],
		wordCount: post.value.readingTime?.words,
	} as const
	: null)

if (post.value) {
	const seoMetaOptions = {
		title: post.value.title,
		description: metaDescription.value,
		robots: shouldNoIndex.value ? 'noindex, nofollow' : undefined,
	}

	if (shouldNoIndex.value) {
		useSeoMeta(seoMetaOptions)
	}
	else {
		useSeoMeta({
			...seoMetaOptions,
			ogType: 'article',
			ogImage: post.value.image,
			ogUrl: articleUrl.value,
			ogSiteName: siteName.value,
			twitterCard: 'summary_large_image',
			articlePublishedTime: publishedTime.value,
			articleModifiedTime: modifiedTime.value,
			articleSection: post.value.categories?.[0],
			articleTag: post.value.tags,
		})

		if (articleSchema.value) {
			useHead({
				script: [{
					type: 'application/ld+json',
					children: JSON.stringify(articleSchema.value),
				}],
			})
		}
	}
	layoutStore.setAside(post.value.meta?.aside as WidgetName[] | undefined)
}
else {
	// // BUG: 部分文章在 Vercel 上以 404 状态码呈现，在 Linux SSG 模式下展示异常
	// const event = useRequestEvent()
	// event && setResponseStatus(event, 404)
	route.meta.title = '404'
	layoutStore.setAside(['blog-log'])
}

if (import.meta.env.DEV) {
	watchEffect(() => setTocAndMeta())
}
</script>

<template>
<template v-if="post">
	<ReadingProgress />
	<PostHeader v-bind="post" />
	<PostExcerpt v-if="excerpt" :excerpt />
	<!-- 使用 float-in 动画会导致搜索跳转不准确 -->
	<ContentRenderer
		class="article"
		:class="getPostTypeClassName(post?.type, { prefix: 'md' })"
		:value="post"
		tag="article"
	/>

	<PostFooter v-bind="post" />
	<PostSurround />
	<PostComment />
</template>

<ZError
	v-else
	icon="solar:confounded-square-bold-duotone"
	title="内容为空或页面不存在"
/>
</template>
