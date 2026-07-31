<script setup lang="ts">
const props = defineProps<{ modelValue: string[]; placeholder?: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string[]] }>()

function updateItem(index: number, value: string): void {
  const next = [...props.modelValue]
  next[index] = value
  emit('update:modelValue', next)
}

function addItem(): void {
  emit('update:modelValue', [...props.modelValue, ''])
}

function removeItem(index: number): void {
  emit(
    'update:modelValue',
    props.modelValue.filter((_, i) => i !== index)
  )
}
</script>

<template>
  <div class="space-y-2">
    <div v-for="(item, index) in modelValue" :key="index" class="flex items-center gap-2">
      <input
        type="text"
        :value="item"
        :placeholder="placeholder"
        class="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        @input="updateItem(index, ($event.target as HTMLInputElement).value)"
      />
      <button
        type="button"
        class="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200"
        aria-label="Option entfernen"
        @click="removeItem(index)"
      >
        ✕
      </button>
    </div>
    <button
      type="button"
      class="rounded-md border border-slate-300 px-3 py-1.5 text-xs hover:bg-slate-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
      @click="addItem"
    >
      + Option hinzufügen
    </button>
  </div>
</template>
