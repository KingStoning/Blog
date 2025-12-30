<script setup lang="ts">
const appConfig = useAppConfig()
useSeoMeta({
	title: '标签',
	description: `${appConfig.title}的所有标签。`,
})

const layoutStore = useLayoutStore()
layoutStore.setAside(['blog-stats', 'blog-tech'])

const { data: listRaw } = await useArticleIndex()
const { listSorted } = useArticleSort(listRaw)
const { tag, tags, listTagged } = useTags(listSorted, { bindQuery: 'tag' })

const selectedTags = computed(() => {
	const availableTags = tags.value
	return tag.value && availableTags.includes(tag.value) ? [tag.value] : availableTags
})

const articlesByTag = computed(() => selectedTags.value
	.map(currentTag => ({
		tag: currentTag,
		articles: listSorted.value.filter(article => article.tags?.includes(currentTag)),
	}))
	.filter(group => group.articles.length))

const totalArticles = computed(() => (tag.value && tags.value.includes(tag.value) ? listTagged.value : listSorted.value).length)
</script>

<template>
<div class="tags proper-height">
	<div class="tags-header">
		<div>
			<h1>标签</h1>
			<p>共 {{ tags.length }} 个标签，{{ totalArticles }} 篇文章。</p>
		</div>
		<ZTagSelector v-model:tag="tag" :tags="tags" />
	</div>

	<p v-if="!tags.length" class="empty-tip">暂无标签。</p>

	<section
		v-for="group in articlesByTag"
		:key="group.tag"
		class="tag-group"
	>
		<div class="tag-title">
			<h2>
				<Icon name="ph:tag-simple-bold" />
				<span>{{ group.tag }}</span>
			</h2>
			<span class="tag-count">{{ group.articles.length }}篇</span>
		</div>

		<TransitionGroup tag="menu" class="tag-list" name="float-in">
			<ZArchive
				v-for="article, index in group.articles"
				:key="article.path"
				v-bind="article"
				:to="article.path"
				:style="{ '--delay': `${index * 0.03}s` }"
			/>
		</TransitionGroup>
	</section>
</div>
</template>

<style lang="scss" scoped>
.tags {
	margin: 1rem;
}

.tags-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 1rem;
	margin-block-end: 1rem;

	h1 {
		margin: 0;
	}

	p {
		margin: 0.2em 0 0;
		color: var(--c-text-2);
	}
}

.empty-tip {
	color: var(--c-text-2);
}

.tag-group {
	margin-block: 1.5rem 2.5rem;
}

.tag-title {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 0.5rem;
	margin-block-end: 0.5rem;
	color: var(--c-text-2);

	h2 {
		display: inline-flex;
		align-items: center;
		gap: 0.35em;
		margin: 0;
		color: var(--c-text-1);
	}
}

.tag-count {
	font-size: 0.9em;
}

.tag-list {
	display: flex;
	flex-direction: column;
	gap: 0.2rem;
}
</style>
