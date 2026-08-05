<script setup lang="ts">
import { ref } from 'vue'

export interface TabDefinition {
  key: string
  label: string
  disabled?: boolean
  disabledReason?: string
}

const props = defineProps<{ tabs: TabDefinition[]; modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [key: string] }>()

const tabRefs = ref<HTMLElement[]>([])

function selectTab(tab: TabDefinition): void {
  if (tab.disabled) return
  emit('update:modelValue', tab.key)
}

/** Pfeiltasten wandern durch die Tabs, Home/End springen an den Rand. Deaktivierte Tabs werden übersprungen. */
function onKeydown(event: KeyboardEvent, index: number): void {
  const lastIndex = props.tabs.length - 1
  let step = 0

  if (event.key === 'ArrowRight') step = 1
  else if (event.key === 'ArrowLeft') step = -1
  else if (event.key === 'Home') {
    event.preventDefault()
    const next = props.tabs.findIndex((tab) => !tab.disabled)
    if (next === -1) return
    emit('update:modelValue', props.tabs[next].key)
    tabRefs.value[next]?.focus()
    return
  } else if (event.key === 'End') {
    event.preventDefault()
    for (let i = lastIndex; i >= 0; i -= 1) {
      if (!props.tabs[i].disabled) {
        emit('update:modelValue', props.tabs[i].key)
        tabRefs.value[i]?.focus()
        return
      }
    }
    return
  }

  if (step === 0) return
  event.preventDefault()

  let next = index
  for (let i = 0; i < props.tabs.length; i += 1) {
    next = next + step < 0 ? lastIndex : next + step > lastIndex ? 0 : next + step
    if (!props.tabs[next].disabled) break
  }
  if (props.tabs[next].disabled) return

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
      :aria-disabled="tab.disabled"
      :disabled="tab.disabled"
      :title="tab.disabled ? tab.disabledReason : undefined"
      :tabindex="modelValue === tab.key ? 0 : -1"
      class="-mb-px border-b-2 pb-2.5 pt-1 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      :class="
        tab.disabled
          ? 'cursor-not-allowed border-transparent text-fg-subtle opacity-50'
          : modelValue === tab.key
            ? 'border-accent text-fg'
            : 'border-transparent text-fg-muted hover:text-fg'
      "
      @click="selectTab(tab)"
      @keydown="onKeydown($event, index)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>
