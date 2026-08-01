<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <div class="flex flex-col items-center justify-center px-6 py-12 text-center">
    <div v-if="$slots.icon" class="mb-3 text-fg-subtle">
      <slot name="icon" />
    </div>
    <p class="text-sm font-medium text-fg">{{ title }}</p>
    <p v-if="description" class="mt-1 max-w-sm text-sm text-fg-muted">{{ description }}</p>
    <div v-if="$slots.action" class="mt-4">
      <slot name="action" />
    </div>
  </div>
</template>
