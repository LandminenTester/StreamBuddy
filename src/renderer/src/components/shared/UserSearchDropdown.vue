<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import AppField from '@renderer/components/ui/AppField.vue'
import { useFieldId } from '@renderer/components/ui/fieldId'
import { controlClasses } from '@renderer/components/ui/controlClasses'

const props = defineProps<{
  modelValue: string
  suggestions: string[]
  label?: string
  placeholder?: string
}>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const fieldId = useFieldId('user-search')
const rootRef = ref<HTMLElement | null>(null)
const open = ref(false)

const filtered = computed(() => {
  const query = props.modelValue.trim().toLowerCase()
  const pool = query
    ? props.suggestions.filter((login) => login.toLowerCase().includes(query))
    : props.suggestions
  return pool.slice(0, 20)
})

function onInput(event: Event): void {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
  open.value = true
}

function select(login: string): void {
  emit('update:modelValue', login)
  open.value = false
}

function handleClickOutside(event: MouseEvent): void {
  if (rootRef.value && !rootRef.value.contains(event.target as Node)) {
    open.value = false
  }
}

onMounted(() => document.addEventListener('mousedown', handleClickOutside))
onBeforeUnmount(() => document.removeEventListener('mousedown', handleClickOutside))
</script>

<template>
  <div ref="rootRef" class="relative">
    <AppField :label="label" :field-id="fieldId">
      <input
        :id="fieldId"
        :value="modelValue"
        :placeholder="placeholder"
        autocomplete="off"
        :class="controlClasses()"
        @input="onInput"
        @focus="open = true"
      />
    </AppField>

    <div
      v-if="open && filtered.length > 0"
      class="absolute left-0 top-full z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-line bg-surface shadow-md"
    >
      <button
        v-for="login in filtered"
        :key="login"
        type="button"
        class="block w-full px-3 py-1.5 text-left text-sm text-fg hover:bg-surface-raised"
        @click="select(login)"
      >
        {{ login }}
      </button>
    </div>
  </div>
</template>
