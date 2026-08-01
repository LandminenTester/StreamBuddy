<script setup lang="ts">
import { computed } from 'vue'
import AppField from './AppField.vue'
import { useFieldId } from './fieldId'
import { controlClasses } from './controlClasses'

const props = withDefaults(
  defineProps<{
    modelValue: string
    label?: string
    hint?: string
    error?: string
    placeholder?: string
    rows?: number
    disabled?: boolean
    required?: boolean
  }>(),
  { rows: 3, disabled: false, required: false }
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const fieldId = useFieldId('textarea')
const classes = computed(() => controlClasses(Boolean(props.error)))
</script>

<template>
  <AppField :label="label" :hint="hint" :error="error" :field-id="fieldId">
    <textarea
      :id="fieldId"
      :value="modelValue"
      :placeholder="placeholder"
      :rows="rows"
      :disabled="disabled"
      :required="required"
      :aria-invalid="Boolean(error)"
      :class="[classes, 'resize-y']"
      @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    />
  </AppField>
</template>
