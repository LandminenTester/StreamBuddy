<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronDown } from 'lucide-vue-next'
import { controlClasses } from '@renderer/components/ui/controlClasses'
import type { CommandTracker, WertType, TrackerAction } from '@shared/types/tracker'
import {
  findTrackerByPlaceholderKey,
  formatTrackerCurrentValue,
  getWertPlaceholder
} from '@shared/utils/wertPlaceholders'

const props = defineProps<{
  modelValue: string
  trackers: CommandTracker[]
  linkedTrackerType?: WertType | null
  linkedTracker?: CommandTracker | null
  linkedTrackerAction?: TrackerAction | null
  label?: string
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const { t } = useI18n()

const textareaRef = ref<HTMLTextAreaElement | null>(null)
const cursorPos = ref(0)
const dropdownOpen = ref(false)
const dropdownRef = ref<HTMLDivElement | null>(null)
const RESPONSE_PLACEHOLDER_PATTERN = /\{wert:([a-z0-9_-]+)\}|\{alter_wert\}|\{neuer_wert\}/gi

type PreviewPart =
  | { type: 'text'; text: string }
  | { type: 'token'; text: string; title: string; missing?: boolean }

const linkedTrackerExample = computed(() => {
  const tracker = props.linkedTracker
  if (!tracker || tracker.type !== 'counter' || !props.linkedTrackerAction) return null

  const delta = props.linkedTrackerAction === 'increment' ? 1 : -1
  return {
    oldValue: String(tracker.value),
    newValue: String(tracker.value + delta)
  }
})

const canInsertActionValues = computed(() => linkedTrackerExample.value !== null)

const previewParts = computed<PreviewPart[]>(() => {
  const parts: PreviewPart[] = []
  let lastIndex = 0

  for (const match of props.modelValue.matchAll(RESPONSE_PLACEHOLDER_PATTERN)) {
    const start = match.index ?? 0
    const placeholder = match[0]
    const rawKey = match[1]

    if (start > lastIndex) {
      parts.push({ type: 'text', text: props.modelValue.slice(lastIndex, start) })
    }

    const actionExample = linkedTrackerExample.value
    if (placeholder === '{alter_wert}' && actionExample) {
      parts.push({
        type: 'token',
        text: actionExample.oldValue,
        title: t('commands.werte.oldValuePreview')
      })
    } else if (placeholder === '{neuer_wert}' && actionExample) {
      parts.push({
        type: 'token',
        text: actionExample.newValue,
        title: t('commands.werte.newValuePreview')
      })
    } else if (rawKey) {
      const tracker = findTrackerByPlaceholderKey(props.trackers, rawKey)
      if (!tracker) {
        parts.push({
          type: 'token',
          text: placeholder,
          title: t('commands.werte.previewMissing'),
          missing: true
        })
        lastIndex = start + placeholder.length
        continue
      }

      const currentValue = formatTrackerCurrentValue(tracker)
      parts.push({
        type: 'token',
        text: currentValue || t('commands.werte.emptyTextValue'),
        title: `${tracker.label} - ${placeholder}`
      })
    } else {
      parts.push({
        type: 'token',
        text: placeholder,
        title: t('commands.werte.previewMissing'),
        missing: true
      })
    }

    lastIndex = start + placeholder.length
  }

  if (lastIndex < props.modelValue.length) {
    parts.push({ type: 'text', text: props.modelValue.slice(lastIndex) })
  }

  return parts.length > 0 ? parts : [{ type: 'text', text: t('commands.werte.previewEmpty') }]
})

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
            @click="insertPlaceholder(getWertPlaceholder(tracker))"
          >
            <span class="min-w-0 flex-1">
              <span class="block truncate">{{ tracker.label }}</span>
              <span class="block truncate text-[11px] text-fg-muted">
                {{
                  tracker.type === 'text'
                    ? $t('commands.werte.typeText')
                    : $t('commands.werte.currentValue', { value: tracker.value })
                }}
              </span>
            </span>
            <span class="shrink-0 font-mono text-fg-muted">{{ getWertPlaceholder(tracker) }}</span>
          </button>
        </div>
      </div>

      <!-- Alter/Neuer Wert — nur bei verknüpftem Zähler -->
      <template v-if="canInsertActionValues">
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

    <div class="rounded border border-line bg-surface-raised/60 px-3 py-2 text-xs text-fg">
      <div class="mb-1 text-[11px] font-medium uppercase tracking-wide text-fg-muted">
        {{ $t('commands.werte.previewLabel') }}
      </div>
      <p class="min-h-5 whitespace-pre-wrap break-words leading-relaxed">
        <template v-for="(part, index) in previewParts" :key="index">
          <span v-if="part.type === 'text'">{{ part.text }}</span>
          <span
            v-else
            class="mx-0.5 inline-flex max-w-full items-center rounded bg-accent/15 px-1.5 py-0.5 font-medium text-accent"
            :class="{ 'bg-danger/10 text-danger': part.missing }"
            :title="part.title"
          >
            {{ part.text }}
          </span>
        </template>
      </p>
      <p v-if="linkedTrackerExample" class="mt-1.5 text-[11px] text-fg-muted">
        {{ $t('commands.werte.actionPreview', linkedTrackerExample) }}
      </p>
    </div>
  </div>
</template>
