import type ArticleProps from '~/types/article'
import type { ArticleOrderType } from '~/types/article'
import { alphabetical } from 'radash'

// TODO 支持分页/分类筛选
export function useArticleIndex(path = 'posts/%') {
	return useAsyncData(
		`index_${path}`,
		() => queryCollection('content')
			.where('stem', 'LIKE', path)
			.select('categories', 'date', 'description', 'image', 'path', 'readingTime', 'recommend', 'tags', 'title', 'type', 'updated')
			.all(),
		{ default: () => [] }, // 不返回 undefined
	)
}

interface UseCategoryOptions {
	bindQuery?: string | false
}

export function useCategory(list: MaybeRefOrGetter<ArticleProps[]>, options?: UseCategoryOptions) {
	const { bindQuery } = options ?? {}
	const category = bindQuery
		? useRouteQuery(bindQuery, undefined, { transform: (value?: string) => value, mode: 'push' })
		: ref<string | undefined>()
	const categories = computed(() => [...new Set(toValue(list).map(item => item.categories?.[0]))])
	const listCategorized = computed(
		() => toValue(list).filter(
			item => !category.value || item.categories?.[0] === category.value,
		),
	)

	return {
		category,
		categories,
		listCategorized,
	}
}

interface UseTagsOptions {
	bindQuery?: string | false
}

export function useTags(list: MaybeRefOrGetter<ArticleProps[]>, options?: UseTagsOptions) {
	const { bindQuery } = options ?? {}
	const tag = bindQuery
		? useRouteQuery(bindQuery, undefined, { transform: (value?: string) => value, mode: 'push' })
		: ref<string | undefined>()
	const tags = computed(() => [...new Set(
		toValue(list)
			.flatMap(item => item.tags ?? [])
			.filter(Boolean),
	)])
	const listTagged = computed(
		() => toValue(list).filter(
			item => !tag.value || item.tags?.includes(tag.value),
		),
	)

	return {
		tag,
		tags,
		listTagged,
	}
}

export function useArticleSort(list: MaybeRefOrGetter<ArticleProps[]>) {
	const appConfig = useAppConfig()
	const sortOrder = ref<ArticleOrderType>(appConfig.pagination.sortOrder || 'date')
	const isAscending = ref<boolean>()
	const listSorted = computed(() => alphabetical(
		toValue(list),
		item => item[sortOrder.value] || '',
		isAscending.value ? 'asc' : 'desc',
	))
	return {
		sortOrder,
		isAscending,
		listSorted,
	}
}

export function getCategoryIcon(category?: string) {
	const appConfig = useAppConfig()
	return appConfig.article.categories[category!]?.icon ?? 'ph:folder-bold'
}

export function getPostTypeClassName(type = 'tech', options = {
	prefix: 'text',
}) {
	const { prefix = 'text' } = options
	return `${prefix}-${type}`
}
