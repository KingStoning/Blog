<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useEventListener, useThrottleFn, useWindowScroll } from '@vueuse/core'

const props = withDefaults(defineProps<{
	targetSelector?: string
}>(), {
	targetSelector: '.article',
})

const progress = ref(0)
const ready = ref(false)

const viewportHeight = ref(0)
const articleRect = reactive({
	top: 0,
	height: 0,
})

const { y } = useWindowScroll()

const progressPercent = computed(() => Math.round(progress.value * 100))

function clamp(value: number) {
	return Math.max(0, Math.min(1, value))
}

function updateMetrics() {
	const target = document.querySelector<HTMLElement>(props.targetSelector)
	if (!target) {
		ready.value = false
		progress.value = 0
		return
	}

	const rect = target.getBoundingClientRect()
	const scrollTop = window.scrollY || document.documentElement.scrollTop

	articleRect.top = rect.top + scrollTop
	articleRect.height = rect.height
	viewportHeight.value = window.innerHeight
	ready.value = true
}

function updateProgress() {
	if (!ready.value || !articleRect.height) {
		progress.value = 0
		return
	}

	const viewportBottom = y.value + viewportHeight.value
	const ratio = (viewportBottom - articleRect.top) / articleRect.height

	progress.value = clamp(ratio)
}

const remeasure = useThrottleFn(() => {
	updateMetrics()
	updateProgress()
}, 200)

function scrollToTop() {
	window.scrollTo({ top: 0, behavior: 'smooth' })
}

watch(y, updateProgress)

onMounted(() => {
	nextTick(() => {
		updateMetrics()
		updateProgress()
	})

	useEventListener(window, 'resize', remeasure, { passive: true })
	useEventListener(window, 'orientationchange', remeasure, { passive: true })
})
</script>

<template>
<div class="reading-progress" :class="{ 'is-active': ready }" aria-hidden="true">
	<div class="reading-progress__track">
		<div class="reading-progress__indicator" :style="{ transform: `scaleX(${progress})` }" />
	</div>

	<div class="reading-progress__floating" :class="{ 'is-visible': ready }">
		<div class="reading-progress__badge" role="status" :aria-label="`阅读进度 ${progressPercent}%`">
			<span class="reading-progress__percent">{{ progressPercent }}%</span>
		</div>
		<ZButton
			class="reading-progress__top-button"
			icon="ph:arrow-up-bold"
			aria-label="回到顶部"
			@click="scrollToTop"
		>
			回到顶部
		</ZButton>
	</div>
</div>
</template>

<style lang="scss" scoped>
.reading-progress {
	position: fixed;
	top: 0;
	inset-inline: 0;
	z-index: 90;
	opacity: 0;
	transition: opacity 0.2s ease;
	pointer-events: none;

	&.is-active {
		opacity: 1;
	}
}

.reading-progress__track {
	height: 6px;
	background: linear-gradient(90deg, var(--c-bg-2), var(--c-bg-1));
	box-shadow: 0 1px 6px var(--ld-shadow);
	overflow: hidden;
}

.reading-progress__indicator {
	height: 100%;
	background: linear-gradient(90deg, var(--c-primary), color-mix(in srgb, var(--c-primary) 70%, transparent));
	transform-origin: left center;
	transition: transform 0.12s ease-out;
}

.reading-progress__floating {
	position: fixed;
	bottom: 1.25rem;
	inset-inline-end: 1rem;
	display: grid;
	gap: 0.5rem;
	justify-items: end;
	opacity: 0;
	transform: translateY(0.5rem);
	transition: opacity 0.2s ease, transform 0.2s ease;
	pointer-events: none;
	z-index: 90;

	&.is-visible {
		opacity: 1;
		transform: none;
	}

	@media (min-width: $breakpoint-widescreen) {
		inset-inline-end: calc((100vw - $breakpoint-widescreen) / 2 + 1rem);
	}
}

.reading-progress__badge,
.reading-progress__top-button {
	border-radius: 999px;
	background-color: var(--ld-bg-card);
	color: var(--c-text);
	border: 1px solid var(--c-border);
	box-shadow: 0 6px 20px var(--ld-shadow);
	pointer-events: auto;
}

.reading-progress__badge {
	padding: 0.5rem 0.8rem;
	min-width: 72px;
	text-align: center;
	font-weight: 600;
	backdrop-filter: blur(6px);
}

.reading-progress__top-button {
	padding-inline: 0.9em;
	background-image: linear-gradient(120deg, var(--c-primary-soft), transparent);
	transition: background-color 0.2s ease, color 0.2s ease, transform 0.2s ease;

	&:hover {
		background-color: var(--c-primary-soft);
		color: var(--c-primary);
		transform: translateY(-1px);
	}
}

.reading-progress__percent {
	font-variant-numeric: tabular-nums;
}
</style>
