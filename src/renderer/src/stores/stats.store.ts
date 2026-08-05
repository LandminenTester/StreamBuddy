import { defineStore } from 'pinia'
import { ref } from 'vue'
import type {
  ChatMessageStatsBucket,
  LiveStatsUpdate,
  ViewerCountSample
} from '@shared/types/stats'

const DAY_MS = 24 * 60 * 60 * 1000

export const useStatsStore = defineStore('stats', () => {
  const messageBuckets = ref<ChatMessageStatsBucket[]>([])
  const viewerSamples = ref<ViewerCountSample[]>([])
  const live = ref<LiveStatsUpdate>({
    currentViewerCount: null,
    messagesLastHour: 0,
    isLive: false,
    streamTitle: null,
    gameName: null
  })
  /**
   * Titel/Spiel unabhaengig vom Live-Status (Get Channel Information bleibt auch
   * offline gueltig, anders als `live.streamTitle`/`gameName`, die nur waehrend
   * eines laufenden Streams gesetzt sind).
   */
  const channelInfo = ref<{ title: string | null; gameName: string | null }>({
    title: null,
    gameName: null
  })

  async function fetchMessagesPerHour(): Promise<void> {
    messageBuckets.value = await window.api.invoke('stats:getMessagesPerHour', {
      sinceMs: Date.now() - DAY_MS
    })
  }

  async function fetchViewerCountSeries(): Promise<void> {
    viewerSamples.value = await window.api.invoke('stats:getViewerCountSeries', {
      sinceMs: Date.now() - DAY_MS
    })
  }

  function subscribeToLiveUpdates(): () => void {
    return window.api.on('stats:onLiveUpdate', (update) => {
      live.value = update
      if (update.currentViewerCount !== null) {
        viewerSamples.value = [
          ...viewerSamples.value,
          { sampledAt: Date.now(), viewerCount: update.currentViewerCount, streamId: null }
        ]
      }
    })
  }

  async function fetchChannelInfo(): Promise<void> {
    const info = await window.api.invoke('stream:getInfo', undefined)
    if (info) channelInfo.value = info
  }

  async function updateStreamInfo(title?: string, gameName?: string): Promise<void> {
    await window.api.invoke('stream:updateInfo', { title, gameName })
    if (title !== undefined) channelInfo.value = { ...channelInfo.value, title }
    if (gameName !== undefined) channelInfo.value = { ...channelInfo.value, gameName }
    if (title !== undefined) live.value = { ...live.value, streamTitle: title }
    if (gameName !== undefined) live.value = { ...live.value, gameName }
  }

  return {
    messageBuckets,
    viewerSamples,
    live,
    channelInfo,
    fetchMessagesPerHour,
    fetchViewerCountSeries,
    subscribeToLiveUpdates,
    fetchChannelInfo,
    updateStreamInfo
  }
})
