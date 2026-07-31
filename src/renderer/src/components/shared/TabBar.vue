<script setup lang="ts">
defineProps<{ tabs: { key: string; label: string }[]; modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [key: string] }>()
</script>

<template>
  <div class="flex flex-wrap gap-1 border-b border-slate-200 dark:border-slate-800">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      type="button"
      class="-mb-px rounded-t-md border-b-2 px-3 py-2 text-sm font-medium transition-colors"
      :class="
        modelValue === tab.key
          ? 'border-twitch-purple bg-twitch-purple/10 text-twitch-purple'
          : 'border-transparent text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
      "
      @click="emit('update:modelValue', tab.key)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>
