<script setup lang="ts">
const props = defineProps<{
	tags?: (string | undefined)[]
}>()

const tag = defineModel<string>('tag')
const tagList = computed(() => props.tags?.filter(Boolean) ?? [])
</script>

<template>
<ZDropdown trigger="focusin">
	<button :disabled="!tagList.length">
		<Icon name="ph:tag-simple-bold" />
		<span class="tag-text">{{ tag ?? '全部标签' }}</span>
	</button>
	<template #content="{ hide }">
		<button :class="{ active: !tag }" @click="hide(), tag = undefined">
			<Icon name="ph:tags-simple-bold" />
			<span>全部标签</span>
		</button>
		<button v-for="item in tagList" :key="item" :class="{ active: item === tag }" @click="hide(), tag = item">
			<Icon name="ph:tag-simple-bold" />
			<span>{{ item }}</span>
		</button>
	</template>
</ZDropdown>
</template>

<style lang="scss" scoped>
button {
	color: var(--c-text-2);
	transition: color 0.2s;

	&:disabled {
		opacity: 0.5;
	}

	&:not(:disabled):hover {
		color: var(--c-primary);
	}
}

.tag-text {
	margin-inline-start: 0.1em;
}
</style>
