<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { Ban, Clock, ExternalLink, MessagesSquare, ShieldOff } from 'lucide-vue-next'
import AppBadge from '@renderer/components/ui/AppBadge.vue'
import EmptyState from '@renderer/components/ui/EmptyState.vue'
import { useChatStore } from '@renderer/stores/chat.store'
import AppButton from '@renderer/components/ui/AppButton.vue'

const store = useChatStore()
const scrollContainer = ref<HTMLElement | null>(null)
const isPinnedToBottom = ref(true)
const hasNewMessages = ref(false)
/** Welche einzelne Nachricht das Aktions-Popover zeigt -- nicht nach Username schluesseln,
 *  sonst oeffnet sich das Popover bei jeder Nachricht desselben Users gleichzeitig. */
const activeMessageId = ref<string | null>(null)

function updatePinnedState(): void {
  const el = scrollContainer.value
  if (!el) return
  isPinnedToBottom.value = el.scrollHeight - el.scrollTop - el.clientHeight < 80
  if (isPinnedToBottom.value) hasNewMessages.value = false
}

async function scrollToLatest(): Promise<void> {
  await nextTick()
  const el = scrollContainer.value
  if (!el) return
  el.scrollTop = el.scrollHeight
  isPinnedToBottom.value = true
  hasNewMessages.value = false
}

async function moderate(
  action: 'timeout' | 'ban' | 'unban',
  targetLogin: string,
  durationSeconds?: number
): Promise<void> {
  await window.api.invoke('chat:moderate', { action, targetLogin, durationSeconds })
  activeMessageId.value = null
}

function openProfile(username: string): void {
  window.open(`https://www.twitch.tv/${encodeURIComponent(username)}`, '_blank', 'noopener')
  activeMessageId.value = null
}

watch(
  () => store.messages.length,
  async () => {
    if (isPinnedToBottom.value) {
      await scrollToLatest()
    } else {
      hasNewMessages.value = true
    }
  }
)
</script>

<template>
  <div class="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-line">
    <div class="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
      <h2 class="truncate text-sm font-semibold text-fg">
        {{ store.status.channel ? `#${store.status.channel}` : $t('dashboard.chat.title') }}
      </h2>
      <span class="flex shrink-0 items-center gap-2">
        <AppBadge :variant="isPinnedToBottom ? 'success' : 'neutral'" dot>
          {{ isPinnedToBottom ? $t('dashboard.chat.liveMode') : $t('dashboard.chat.pausedMode') }}
        </AppBadge>
        <AppBadge :variant="store.status.connected ? 'success' : 'neutral'" dot>
          {{
            store.status.connected
              ? $t('dashboard.chatConnected')
              : $t('dashboard.chatDisconnected')
          }}
        </AppBadge>
      </span>
    </div>

    <div
      ref="scrollContainer"
      class="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-3"
      @scroll="updatePinnedState"
    >
      <EmptyState
        v-if="store.messages.length === 0"
        :title="$t('dashboard.chat.empty')"
        :description="$t('dashboard.chat.emptyHint')"
      >
        <template #icon><MessagesSquare class="h-8 w-8" /></template>
      </EmptyState>

      <div
        v-for="msg in store.messages"
        :key="msg.id"
        class="relative py-1 text-sm leading-relaxed"
      >
        <AppBadge v-if="msg.isBot" class="mr-1 align-middle" variant="accent">
          {{ $t('dashboard.chat.botBadge') }}
        </AppBadge>
        <span class="mr-1 inline-flex align-middle">
          <span
            v-for="badge in msg.badges"
            :key="`${badge.id}-${badge.version}`"
            class="mr-0.5 inline-flex h-4 min-w-4 items-center justify-center overflow-hidden rounded-sm bg-surface-subtle text-[9px] uppercase text-fg-muted"
            :title="badge.title"
          >
            <img v-if="badge.imageUrl" :src="badge.imageUrl" :alt="badge.title" class="h-4 w-4" />
            <span v-else>{{ badge.id.slice(0, 1) }}</span>
          </span>
        </span>
        <button
          type="button"
          class="font-semibold hover:underline"
          :style="msg.color ? { color: msg.color } : undefined"
          @click="activeMessageId = activeMessageId === msg.id ? null : msg.id"
        >
          {{ msg.displayName }}
        </button>
        <span class="text-fg">: </span>
        <template v-for="(segment, index) in msg.segments" :key="`${msg.id}-${index}`">
          <img
            v-if="segment.type === 'emote' && segment.url"
            :src="segment.url"
            :alt="segment.text"
            :title="segment.text"
            class="mx-0.5 inline h-7 w-auto align-middle"
          />
          <span v-else class="text-fg">{{ segment.text }}</span>
        </template>

        <div
          v-if="activeMessageId === msg.id"
          class="absolute left-0 top-7 z-10 w-56 rounded-md border border-line bg-surface p-1.5 shadow-lg"
        >
          <button
            type="button"
            class="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-fg hover:bg-surface-subtle"
            @click="moderate('timeout', msg.username, 600)"
          >
            <Clock class="h-3.5 w-3.5" />
            {{ $t('dashboard.chat.actions.timeout10') }}
          </button>
          <button
            type="button"
            class="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-danger hover:bg-danger-bg"
            @click="moderate('ban', msg.username)"
          >
            <Ban class="h-3.5 w-3.5" />
            {{ $t('dashboard.chat.actions.ban') }}
          </button>
          <button
            type="button"
            class="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-fg hover:bg-surface-subtle"
            @click="moderate('unban', msg.username)"
          >
            <ShieldOff class="h-3.5 w-3.5" />
            {{ $t('dashboard.chat.actions.unban') }}
          </button>
          <button
            type="button"
            class="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-fg hover:bg-surface-subtle"
            @click="openProfile(msg.username)"
          >
            <ExternalLink class="h-3.5 w-3.5" />
            {{ $t('dashboard.chat.actions.profile') }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="!isPinnedToBottom" class="border-t border-line px-4 py-2">
      <AppButton size="sm" class="w-full" @click="scrollToLatest">
        {{ hasNewMessages ? $t('dashboard.chat.newMessages') : $t('dashboard.chat.backToLive') }}
      </AppButton>
    </div>
  </div>
</template>
