<script setup lang="ts">
import { computed } from 'vue'
import AppField from './AppField.vue'
import { useFieldId } from './fieldId'
import { controlClasses } from './controlClasses'

export interface SelectOption {
  value: string
  label: string
}

const props = withDefaults(
  defineProps<{
    modelValue: string
    options: SelectOption[]
    label?: string
    hint?: string
    error?: string
    disabled?: boolean
  }>(),
  { disabled: false }
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const fieldId = useFieldId('select')
const classes = computed(() => controlClasses(Boolean(props.error)))
</script>

<template>
  <AppField :label="label" :hint="hint" :error="error" :field-id="fieldId">
    <select
      :id="fieldId"
      :value="modelValue"
      :disabled="disabled"
      :aria-invalid="Boolean(error)"
      :class="classes"
      @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    >
      <option v-for="option in options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
  </AppField>
</template>
