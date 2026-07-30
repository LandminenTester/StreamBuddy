<script setup lang="ts">
defineProps<{ title: string }>()
const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
    <div class="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl dark:bg-slate-900" @click.stop>
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-lg font-semibold">{{ title }}</h2>
        <button
          class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          @click="emit('close')"
        >
          ✕
        </button>
      </div>
      <slot />
    </div>
  </div>
</template>
