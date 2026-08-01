import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { StreamSummary, ViewerSession, StreamStats } from '@shared/types/viewers'

export const useViewersStore = defineStore('viewers', () => {
  const presentUsers = ref<string[]>([])
  const streams = ref<StreamSummary[]>([])
  const selectedStreamViewers = ref<ViewerSession[]>([])
  const selectedStreamStats = ref<StreamStats | null>(null)

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
    streams,
    selectedStreamViewers,
    selectedStreamStats,
    fetchPresent,
    fetchStreams,
    fetchStreamViewers,
    subscribeToPresenceUpdates
  }
})
