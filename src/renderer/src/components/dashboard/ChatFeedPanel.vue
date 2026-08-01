<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { MessagesSquare } from 'lucide-vue-next'
import AppBadge from '@renderer/components/ui/AppBadge.vue'
import EmptyState from '@renderer/components/ui/EmptyState.vue'
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
  <!--
    Der Chat behaelt bewusst einen Rahmen: er ist der einzige abgegrenzte
    Live-Bereich der Seite. Die Hoehe kommt vom Elternelement (h-full).
  -->
  <div class="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-line">
    <div class="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
      <h2 class="truncate text-sm font-semibold text-fg">
        {{ store.status.channel ? `#${store.status.channel}` : $t('dashboard.chat.title') }}
      </h2>
      <AppBadge :variant="store.status.connected ? 'success' : 'neutral'" dot>
        {{
          store.status.connected ? $t('dashboard.chatConnected') : $t('dashboard.chatDisconnected')
        }}
      </AppBadge>
    </div>

    <div ref="scrollContainer" class="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-3">
      <EmptyState
        v-if="store.messages.length === 0"
        :title="$t('dashboard.chat.empty')"
        :description="$t('dashboard.chat.emptyHint')"
      >
        <template #icon><MessagesSquare class="h-8 w-8" /></template>
      </EmptyState>

      <p v-for="msg in store.messages" :key="msg.id" class="py-0.5 text-sm leading-relaxed">
        <span class="font-semibold" :style="msg.color ? { color: msg.color } : undefined">
          {{ msg.displayName }}
        </span>
        <span class="text-fg">: {{ msg.message }}</span>
      </p>
    </div>
  </div>
</template>
