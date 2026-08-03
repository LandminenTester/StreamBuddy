<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { X } from 'lucide-vue-next'

withDefaults(defineProps<{ title: string; maxWidth?: string }>(), {
  maxWidth: 'max-w-lg'
})
const emit = defineEmits<{ close: [] }>()

const panel = ref<HTMLElement | null>(null)
const previouslyFocused = ref<HTMLElement | null>(null)

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

function focusableElements(): HTMLElement[] {
  if (!panel.value) return []
  return Array.from(panel.value.querySelectorAll<HTMLElement>(FOCUSABLE))
}

/** Haelt den Tab-Fokus innerhalb des Dialogs und schliesst bei Escape. */
function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    event.stopPropagation()
    emit('close')
    return
  }
  if (event.key !== 'Tab') return

  const elements = focusableElements()
  if (elements.length === 0) return

  const first = elements[0]
  const last = elements[elements.length - 1]
  const active = document.activeElement

  if (event.shiftKey && active === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && active === last) {
    event.preventDefault()
    first.focus()
  }
}

onMounted(() => {
  previouslyFocused.value = document.activeElement as HTMLElement | null
  document.addEventListener('keydown', onKeydown)
  focusableElements()[0]?.focus()
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  previouslyFocused.value?.focus()
})
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div
        ref="panel"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
        class="flex max-h-[85vh] w-full flex-col rounded-lg bg-surface-elevated shadow-xl"
        :class="maxWidth"
      >
        <div class="flex items-center justify-between gap-4 px-5 pb-3 pt-5">
          <h2 class="text-lg font-semibold text-fg">{{ title }}</h2>
          <button
            type="button"
            class="rounded-md p-1 text-fg-subtle transition-colors hover:bg-surface-subtle hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            aria-label="Schließen"
            @click="emit('close')"
          >
            <X class="h-4 w-4" />
          </button>
        </div>

        <div class="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-5 pb-5">
          <slot />
        </div>

        <div
          v-if="$slots.footer"
          class="flex items-center justify-end gap-2 border-t border-line px-5 py-4"
        >
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>
