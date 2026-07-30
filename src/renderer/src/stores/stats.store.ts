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
    isLive: false
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

  return {
    messageBuckets,
    viewerSamples,
    live,
    fetchMessagesPerHour,
    fetchViewerCountSeries,
    subscribeToLiveUpdates
  }
})
