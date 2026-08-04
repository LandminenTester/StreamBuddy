import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { StreamSummary, ViewerSession, StreamStats } from '@shared/types/viewers'
import { isKnownStreamerBot } from '@shared/knownStreamerBots'
import { useChatStore } from './chat.store'

export const useViewersStore = defineStore('viewers', () => {
  const presentUsers = ref<string[]>([])
  const streams = ref<StreamSummary[]>([])
  const selectedStreamViewers = ref<ViewerSession[]>([])
  const selectedStreamStats = ref<StreamStats | null>(null)

  /**
   * Fuer die Chat-Zuschauer-Anzeige: ohne bekannte Bots und ohne den Streamer selbst.
   * Beeinflusst NICHT den numerischen Viewer-Count (der kommt separat aus stats.store).
   */
  const visiblePresentUsers = computed(() => {
    const chatStore = useChatStore()
    const channelLogin = chatStore.targetChannel.trim().toLowerCase()
    return presentUsers.value.filter(
      (login) => !isKnownStreamerBot(login) && login.toLowerCase() !== channelLogin
    )
  })

  async function fetchPresent(): Promise<void> {
    presentUsers.value = await window.api.invoke('viewers:getPresent', undefined)
  }

  async function fetchStreams(limit = 50, offset = 0): Promise<void> {
    streams.value = await window.api.invoke('viewers:getStreams', { limit, offset })
  }

  async function fetchStreamViewers(streamId: string): Promise<void> {
    selectedStreamViewers.value = await window.api.invoke('viewers:getStreamViewers', { streamId })
    selectedStreamStats.value = await window.api.invoke('viewers:getStreamStats', { streamId })
  }

  function subscribeToPresenceUpdates(): () => void {
    return window.api.on('viewers:onPresenceUpdate', (users: string[]) => {
      presentUsers.value = users
    })
  }

  return {
    presentUsers,
    visiblePresentUsers,
    streams,
    selectedStreamViewers,
    selectedStreamStats,
    fetchPresent,
    fetchStreams,
    fetchStreamViewers,
    subscribeToPresenceUpdates
  }
})
