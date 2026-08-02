<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronDown } from 'lucide-vue-next'
import { controlClasses } from '@renderer/components/ui/controlClasses'
import type { CommandTracker, WertType } from '@shared/types/tracker'

const props = defineProps<{
  modelValue: string
  trackers: CommandTracker[]
  linkedTrackerType?: WertType | null
  label?: string
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const { t } = useI18n()

const textareaRef = ref<HTMLTextAreaElement | null>(null)
const cursorPos = ref(0)
const dropdownOpen = ref(false)
const dropdownRef = ref<HTMLDivElement | null>(null)

function saveCursor(): void {
  cursorPos.value = textareaRef.value?.selectionStart ?? cursorPos.value
}

function insertPlaceholder(placeholder: string): void {
  const text = props.modelValue
  const pos = cursorPos.value
  const newText = text.slice(0, pos) + placeholder + text.slice(pos)
  emit('update:modelValue', newText)
  dropdownOpen.value = false

  // Fokus + Cursorposition nach dem DOM-Update wiederherstellen
  const nextPos = pos + placeholder.length
  setTimeout(() => {
    if (textareaRef.value) {
      textareaRef.value.focus()
      textareaRef.value.setSelectionRange(nextPos, nextPos)
      cursorPos.value = nextPos
    }
  }, 0)
}

function handleClickOutside(event: MouseEvent): void {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    dropdownOpen.value = false
  }
}

onMounted(() => document.addEventListener('mousedown', handleClickOutside))
onBeforeUnmount(() => document.removeEventListener('mousedown', handleClickOutside))
</script>

<template>
  <div class="space-y-1.5">
    <label v-if="label" class="block text-sm font-medium text-fg">{{ label }}</label>

    <textarea
      ref="textareaRef"
      :value="modelValue"
      rows="3"
      :class="[controlClasses(), 'resize-y']"
      @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
      @mouseup="saveCursor"
      @keyup="saveCursor"
      @focus="saveCursor"
    />

    <!-- Toolbar -->
    <div class="flex flex-wrap items-center gap-1.5">
      <!-- Wert einfügen Dropdown -->
      <div ref="dropdownRef" class="relative">
        <button
          type="button"
          class="flex items-center gap-1 rounded border border-line px-2 py-1 text-xs text-fg-muted transition-colors hover:border-accent hover:text-fg"
          @click="dropdownOpen = !dropdownOpen"
        >
          {{ t('commands.werte.insertPlaceholder') }}
          <ChevronDown class="h-3 w-3" />
        </button>

        <div
          v-if="dropdownOpen"
          class="absolute left-0 top-full z-10 mt-1 min-w-[160px] rounded-md border border-line bg-surface shadow-md"
        >
          <div v-if="trackers.length === 0" class="px-3 py-2 text-xs text-fg-muted">
            {{ t('commands.werte.empty') }}
          </div>
          <button
            v-for="tracker in trackers"
            :key="tracker.id"
            type="button"
            class="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-fg hover:bg-surface-raised"
            @click="insertPlaceholder('{wert:' + tracker.id + '}')"
          >
            <span class="min-w-0 flex-1 truncate">{{ tracker.label }}</span>
            <span class="shrink-0 font-mono text-fg-muted">{{ '{wert:' + tracker.id + '}' }}</span>
          </button>
        </div>
      </div>

      <!-- Alter/Neuer Wert — nur bei verknüpftem Zähler -->
      <template v-if="linkedTrackerType === 'counter'">
        <button
          type="button"
          class="rounded border border-line px-2 py-1 font-mono text-xs text-fg-muted transition-colors hover:border-accent hover:text-fg"
          @click="insertPlaceholder('{alter_wert}')"
        >
          {{ t('commands.werte.insertOldValue') }}
        </button>
        <button
          type="button"
          class="rounded border border-line px-2 py-1 font-mono text-xs text-fg-muted transition-colors hover:border-accent hover:text-fg"
          @click="insertPlaceholder('{neuer_wert}')"
        >
          {{ t('commands.werte.insertNewValue') }}
        </button>
      </template>
    </div>
  </div>
</template>
