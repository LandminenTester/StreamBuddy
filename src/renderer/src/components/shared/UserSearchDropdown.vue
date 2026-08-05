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
const inputRef = ref<HTMLInputElement | null>(null)
const menuRef = ref<HTMLElement | null>(null)
const open = ref(false)
const remoteResults = ref<string[]>([])
const menuStyle = ref<{ left: string; top: string; width: string }>({
  left: '0px',
  top: '0px',
  width: '0px'
})
let debounceTimer: ReturnType<typeof setTimeout> | null = null
let requestId = 0

/** Positioniert das per Teleport aus dem Modal-Overflow gelöste Dropdown relativ zum Input. */
function updateMenuPosition(): void {
  if (!inputRef.value) return
  const rect = inputRef.value.getBoundingClientRect()
  menuStyle.value = {
    left: `${rect.left}px`,
    top: `${rect.bottom + 4}px`,
    width: `${rect.width}px`
  }
}

function handleScrollOrResize(): void {
  if (open.value) updateMenuPosition()
}

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
  updateMenuPosition()
  runSearch(value)
}

function select(login: string): void {
  emit('update:modelValue', login)
  open.value = false
}

function handleClickOutside(event: MouseEvent): void {
  const target = event.target as Node
  const insideRoot = rootRef.value?.contains(target) ?? false
  const insideMenu = menuRef.value?.contains(target) ?? false
  if (!insideRoot && !insideMenu) {
    open.value = false
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside)
  window.addEventListener('scroll', handleScrollOrResize, true)
  window.addEventListener('resize', handleScrollOrResize)
})
onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleClickOutside)
  window.removeEventListener('scroll', handleScrollOrResize, true)
  window.removeEventListener('resize', handleScrollOrResize)
  if (debounceTimer) clearTimeout(debounceTimer)
})

function onFocus(): void {
  open.value = true
  updateMenuPosition()
  if (props.search) runSearch(props.modelValue)
}
</script>

<template>
  <div ref="rootRef" class="relative">
    <AppField :label="label" :field-id="fieldId">
      <input
        :id="fieldId"
        ref="inputRef"
        :value="modelValue"
        :placeholder="placeholder"
        autocomplete="off"
        :class="controlClasses()"
        @input="onInput"
        @focus="onFocus"
      />
    </AppField>

    <Teleport to="body">
      <div
        v-if="open && filtered.length > 0"
        ref="menuRef"
        class="fixed z-[60] max-h-56 overflow-y-auto rounded-md border border-line bg-surface shadow-md"
        :style="menuStyle"
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
    </Teleport>
  </div>
</template>
