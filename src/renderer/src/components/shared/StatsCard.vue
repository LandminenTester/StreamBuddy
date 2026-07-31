<script setup lang="ts">
defineProps<{ label: string; value: string }>()
</script>

<template>
  <div class="rounded-lg border border-slate-200 p-4 dark:border-neutral-800">
    <p class="text-xs font-medium uppercase tracking-wide text-slate-500">{{ label }}</p>
    <p class="mt-1 text-2xl font-semibold">{{ value }}</p>
  </div>
</template>
