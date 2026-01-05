<script setup lang="ts">
import { sort } from 'radash'

const appConfig = useAppConfig()

const layoutStore = useLayoutStore()
layoutStore.setAside(['blog-stats', 'blog-tech', 'comm-group'])

const { data: listRaw } = await useArticleIndex()
const { listSorted, isAscending, sortOrder } = useArticleSort(listRaw)
const { category, categories, listCategorized } = useCategory(listSorted, { bindQuery: 'category' })
const { tag, tags, listTagged } = useTags(listCategorized, { bindQuery: 'tag' })
const { page, totalPages, listPaged } = usePagination(listTagged, { bindQuery: 'page' })

watch(category, () => {
	page.value = 1
})
watch(tag, () => {
	page.value = 1
})

useSeoMeta({
	title: () => (page.value > 1 ? `第${page.value}页 | ${appConfig.title}` : appConfig.title),
	description: appConfig.description,
	ogImage: appConfig.author.avatar,
})

const listRecommended = computed(() => sort(
	listRaw.value.filter(item => item?.recommend),
	post => post.recommend || 0,
	true,
))
</script>

<template>
<div class="mobile-only">
	<!-- 若不包裹，display: none 在 JS 加载后才有足够优先级 -->
	<ZhiluHeader to="/" />
</div>

<PostSlide v-if="listRecommended.length && page === 1 && !category && !tag" :list="listRecommended" />

<div class="post-list proper-height">
	<div class="toolbar">
		<div>
			<!-- 外层元素用于占位 -->
			<ZRawLink to="/preview" class="preview-entrance">
				<Icon name="ph:file-lock-bold" />
				查看预览文章
			</ZRawLink>
		</div>

		<div class="filters">
			<ZTagSelector v-model:tag="tag" :tags="tags" />
			<ZOrderToggle
				v-model:is-ascending="isAscending"
				v-model:sort-order="sortOrder"
				v-model:category="category"
				:categories
			/>
		</div>
	</div>

	<TransitionGroup name="float-in">
		<ZArticle
			v-for="article, index in listPaged"
			:key="article.path"
			v-bind="article"
			:to="article.path"
			:use-updated="sortOrder === 'updated'"
			:style="{ '--delay': `${index * 0.05}s` }"
		/>
	</TransitionGroup>

	<ZPagination v-model="page" class="pagination" sticky :total-pages="totalPages" />
</div>
</template>

<style lang="scss" scoped>
.toolbar {
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.filters {
	display: flex;
	align-items: center;
	gap: 0.75rem;
}

.preview-entrance {
	position: relative;
	opacity: 0;
	transition: all 0.2s 1s, color 0.2s;
	z-index: -1;

	:hover > & {
		opacity: 1;
		color: var(--c-primary);
		z-index: 0;
	}
}

.post-list {
	margin: 1rem;
}
</style>
