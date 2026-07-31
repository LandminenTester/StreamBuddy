<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { useChatStore } from '@renderer/stores/chat.store'

const store = useChatStore()
const scrollContainer = ref<HTMLElement | null>(null)

watch(
  () => store.messages.length,
  async () => {
    await nextTick()
    const el = scrollContainer.value
    if (!el) return
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80
    if (isNearBottom) el.scrollTop = el.scrollHeight
  }
)
</script>

<template>
  <div
    ref="scrollContainer"
    class="h-80 overflow-y-auto rounded-md border border-slate-100 bg-slate-50 p-3 text-sm dark:border-neutral-800 dark:bg-neutral-900"
  >
    <p v-if="store.messages.length === 0" class="py-6 text-center text-slate-500">
      Noch keine Chat-Nachrichten empfangen.
    </p>
    <p v-for="msg in store.messages" :key="msg.id" class="py-0.5 leading-relaxed">
      <span class="font-semibold" :style="msg.color ? { color: msg.color } : undefined">
        {{ msg.displayName }}
      </span>
      <span>: {{ msg.message }}</span>
    </p>
  </div>
</template>
