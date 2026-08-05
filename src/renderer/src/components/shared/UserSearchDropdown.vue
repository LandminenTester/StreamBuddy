<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import AppField from '@renderer/components/ui/AppField.vue'
import { useFieldId } from '@renderer/components/ui/fieldId'
import { controlClasses } from '@renderer/components/ui/controlClasses'

const props = defineProps<{
  modelValue: string
  /** Statische Vorschlagsliste, lokal gefiltert. Ignoriert, wenn `search` gesetzt ist. */
  suggestions?: string[]
  /** Asynchrone Suche (z.B. eine API) statt lokaler Filterung; debounced automatisch. */
  search?: (query: string) => Promise<string[]>
  label?: string
  placeholder?: string
}>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const fieldId = useFieldId('user-search')
const rootRef = ref<HTMLElement | null>(null)
const open = ref(false)
const remoteResults = ref<string[]>([])
let debounceTimer: ReturnType<typeof setTimeout> | null = null
let requestId = 0

const filtered = computed(() => {
  if (props.search) return remoteResults.value
  const query = props.modelValue.trim().toLowerCase()
  const pool = query
    ? (props.suggestions ?? []).filter((login) => login.toLowerCase().includes(query))
    : (props.suggestions ?? [])
  return pool.slice(0, 20)
})

function runSearch(query: string): void {
  if (!props.search) return
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(async () => {
    const currentRequest = ++requestId
    const results = await props.search!(query)
    if (currentRequest === requestId) remoteResults.value = results
  }, 250)
}

function onInput(event: Event): void {
  const value = (event.target as HTMLInputElement).value
  emit('update:modelValue', value)
  open.value = true
  runSearch(value)
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
onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleClickOutside)
  if (debounceTimer) clearTimeout(debounceTimer)
})

function onFocus(): void {
  open.value = true
  if (props.search) runSearch(props.modelValue)
}
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
        @focus="onFocus"
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
