<script setup lang="ts">
const appConfig = useAppConfig()
const timeEstablished = appConfig.timeEstablished

const blogLog = [
	{ label: '2025-10-26', value: '开启新的博客框架' },
	{ label: '2025-10-03', value: '数据库损坏,博客丢失' },
	{ label: '2024-5-4', value: '接触到博客' },
]
</script>

<template>
<ZWidget card title="更新日志">
	<ZDlGroup size="large" :items="blogLog" />
</ZWidget>
</template>
