<script setup lang="ts">
import { computed } from 'vue'
import AppField from './AppField.vue'
import { useFieldId } from './fieldId'
import { controlClasses } from './controlClasses'

const props = withDefaults(
  defineProps<{
    modelValue: string | number
    label?: string
    hint?: string
    error?: string
    type?: 'text' | 'password' | 'number' | 'url'
    placeholder?: string
    disabled?: boolean
    min?: number
    max?: number
    step?: number
    required?: boolean
    list?: string
  }>(),
  { type: 'text', disabled: false, required: false }
)

const emit = defineEmits<{ 'update:modelValue': [value: string | number] }>()

const fieldId = useFieldId('input')
const classes = computed(() => controlClasses(Boolean(props.error)))

function onInput(event: Event): void {
  const raw = (event.target as HTMLInputElement).value
  emit('update:modelValue', props.type === 'number' ? Number(raw) : raw)
}
</script>

<template>
  <AppField :label="label" :hint="hint" :error="error" :field-id="fieldId">
    <input
      :id="fieldId"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :min="min"
      :max="max"
      :step="step"
      :required="required"
      :list="list"
      :aria-invalid="Boolean(error)"
      :class="classes"
      @input="onInput"
    />
  </AppField>
</template>
