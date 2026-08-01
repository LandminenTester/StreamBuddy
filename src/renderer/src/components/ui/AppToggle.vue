<script setup lang="ts">
import { useFieldId } from './fieldId'

withDefaults(
  defineProps<{
    modelValue: boolean
    label?: string
    description?: string
    disabled?: boolean
  }>(),
  { disabled: false }
)

const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const fieldId = useFieldId('toggle')
</script>

<template>
  <label
    :for="fieldId"
    class="flex cursor-pointer items-start justify-between gap-4"
    :class="disabled && 'cursor-not-allowed opacity-50'"
  >
    <span v-if="label || description" class="min-w-0">
      <span v-if="label" class="block text-sm font-medium text-fg">{{ label }}</span>
      <span v-if="description" class="mt-0.5 block text-xs text-fg-muted">{{ description }}</span>
    </span>
    <input
      :id="fieldId"
      type="checkbox"
      class="peer sr-only"
      :checked="modelValue"
      :disabled="disabled"
      @change="emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
    />
    <span
      class="relative mt-0.5 h-5 w-9 shrink-0 rounded-full bg-line-strong transition-colors peer-checked:bg-accent peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent"
    >
      <span
        class="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-surface transition-transform peer-checked:translate-x-4"
      />
    </span>
  </label>
</template>
