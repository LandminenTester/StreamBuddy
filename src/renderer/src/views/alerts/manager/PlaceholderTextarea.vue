<script setup lang="ts">
import { ref } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: string
    placeholders: string[]
    rows?: number
    placeholder?: string
  }>(),
  { rows: 2, placeholder: undefined }
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const textareaRef = ref<HTMLTextAreaElement | null>(null)
const cursorPos = ref(0)

function saveCursor(): void {
  cursorPos.value = textareaRef.value?.selectionStart ?? cursorPos.value
}

function insert(token: string): void {
  const pos = cursorPos.value
  const next = props.modelValue.slice(0, pos) + token + props.modelValue.slice(pos)
  emit('update:modelValue', next)
  const nextPos = pos + token.length
  setTimeout(() => {
    textareaRef.value?.focus()
    textareaRef.value?.setSelectionRange(nextPos, nextPos)
    cursorPos.value = nextPos
  })
}
</script>

<template>
  <div class="space-y-1.5">
    <textarea
      ref="textareaRef"
      :value="modelValue"
      :rows="rows"
      :placeholder="placeholder"
      class="w-full resize-y rounded-md border border-line bg-surface px-3 py-2 text-sm text-fg"
      @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
      @mouseup="saveCursor"
      @keyup="saveCursor"
      @focus="saveCursor"
    />
    <div class="flex flex-wrap gap-1.5">
      <button
        v-for="token in placeholders"
        :key="token"
        type="button"
        class="rounded border border-line px-2 py-0.5 font-mono text-xs text-fg-muted transition-colors hover:border-accent hover:text-fg"
        @mousedown.prevent="insert(token)"
      >
        {{ token }}
      </button>
    </div>
  </div>
</template>
