<script setup lang="ts">
import { Plus, X } from 'lucide-vue-next'
import { CONTROL_BASE } from '@renderer/components/ui/controlClasses'

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
        :class="[CONTROL_BASE, 'border-line-strong focus:border-accent']"
        @input="updateItem(index, ($event.target as HTMLInputElement).value)"
      />
      <button
        type="button"
        class="shrink-0 rounded-md p-1.5 text-fg-subtle transition-colors hover:bg-surface-subtle hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        :aria-label="$t('common.delete')"
        @click="removeItem(index)"
      >
        <X class="h-4 w-4" />
      </button>
    </div>
    <button
      type="button"
      class="inline-flex items-center gap-1.5 rounded-md border border-line-strong px-2.5 py-1.5 text-xs font-medium text-fg transition-colors hover:bg-surface-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      @click="addItem"
    >
      <Plus class="h-3.5 w-3.5" />
      {{ $t('common.add') }}
    </button>
  </div>
</template>
