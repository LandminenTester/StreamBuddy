<script setup lang="ts">
import { ref } from 'vue'

export interface TabDefinition {
  key: string
  label: string
}

const props = defineProps<{ tabs: TabDefinition[]; modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [key: string] }>()

const tabRefs = ref<HTMLElement[]>([])

/** Pfeiltasten wandern durch die Tabs, Home/End springen an den Rand. */
function onKeydown(event: KeyboardEvent, index: number): void {
  const lastIndex = props.tabs.length - 1
  let next: number | null = null

  if (event.key === 'ArrowRight') next = index === lastIndex ? 0 : index + 1
  else if (event.key === 'ArrowLeft') next = index === 0 ? lastIndex : index - 1
  else if (event.key === 'Home') next = 0
  else if (event.key === 'End') next = lastIndex

  if (next === null) return
  event.preventDefault()
  emit('update:modelValue', props.tabs[next].key)
  tabRefs.value[next]?.focus()
}
</script>

<template>
  <div role="tablist" class="flex flex-wrap gap-6 border-b border-line">
    <button
      v-for="(tab, index) in tabs"
      :key="tab.key"
      ref="tabRefs"
      type="button"
      role="tab"
      :aria-selected="modelValue === tab.key"
      :tabindex="modelValue === tab.key ? 0 : -1"
      class="-mb-px border-b-2 pb-2.5 pt-1 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      :class="
        modelValue === tab.key
          ? 'border-accent text-fg'
          : 'border-transparent text-fg-muted hover:text-fg'
      "
      @click="emit('update:modelValue', tab.key)"
      @keydown="onKeydown($event, index)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>
