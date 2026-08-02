<script setup lang="ts">
import { Check } from 'lucide-vue-next'
import { useFieldId } from './fieldId'

withDefaults(
  defineProps<{
    modelValue?: boolean
    checked?: boolean
    label?: string
    disabled?: boolean
  }>(),
  { modelValue: undefined, checked: undefined, disabled: false }
)

const emit = defineEmits<{ 'update:modelValue': [value: boolean]; change: [value: boolean] }>()

const fieldId = useFieldId('checkbox')

function update(value: boolean): void {
  emit('update:modelValue', value)
  emit('change', value)
}
</script>

<template>
  <label
    :for="fieldId"
    class="inline-flex min-w-0 cursor-pointer items-center gap-2 text-sm text-fg"
    :class="disabled && 'cursor-not-allowed opacity-50'"
  >
    <input
      :id="fieldId"
      type="checkbox"
      class="peer sr-only"
      :checked="modelValue ?? checked ?? false"
      :disabled="disabled"
      @change="update(($event.target as HTMLInputElement).checked)"
    />
    <span
      class="grid h-4 w-4 shrink-0 place-items-center rounded border border-line-strong bg-surface text-transparent transition-colors peer-checked:border-accent peer-checked:bg-accent peer-checked:text-accent-contrast peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent"
    >
      <Check class="h-3 w-3" stroke-width="3" />
    </span>
    <span v-if="label" class="truncate">{{ label }}</span>
  </label>
</template>
