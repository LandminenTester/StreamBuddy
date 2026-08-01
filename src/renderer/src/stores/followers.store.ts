import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { FollowerEntry, FollowerHistoryEntry, SyncResult, SyncStatus } from '@shared/types/followers'

export const useFollowersStore = defineStore('followers', () => {
  const followers = ref<FollowerEntry[]>([])
  const history = ref<FollowerHistoryEntry[]>([])
  const syncStatus = ref<SyncStatus>({ lastSyncedAt: null, totalCount: 0, newCount: 0, lostCount: 0 })
  const loading = ref(false)
  const syncing = ref(false)
  const error = ref<string | null>(null)

  async function fetchAll(): Promise<void> {
    loading.value = true
    try {
      followers.value = await window.api.invoke('followers:getAll', undefined)
    } finally {
      loading.value = false
    }
  }

  async function fetchHistory(eventType?: 'follow' | 'unfollow'): Promise<void> {
    history.value = await window.api.invoke('followers:getHistory', { eventType })
  }

  async function fetchSyncStatus(): Promise<void> {
    syncStatus.value = await window.api.invoke('followers:getSyncStatus', undefined)
  }

  async function syncNow(): Promise<SyncResult> {
    syncing.value = true
    error.value = null
    try {
      const result = await window.api.invoke('followers:syncNow', undefined)
      syncStatus.value = {
        lastSyncedAt: result.syncedAt,
        totalCount: result.totalCount,
        newCount: result.newCount,
        lostCount: result.lostCount
      }
      await fetchAll()
      return result
    } catch (err) {
      error.value = String(err)
      throw err
    } finally {
      syncing.value = false
    }
  }

  function subscribeToSyncComplete(): () => void {
    return window.api.on('followers:onSyncComplete', (result: SyncResult) => {
      syncStatus.value = {
        lastSyncedAt: result.syncedAt,
        totalCount: result.totalCount,
        newCount: result.newCount,
        lostCount: result.lostCount
      }
      void fetchAll()
    })
  }

  return {
    followers,
    history,
    syncStatus,
    loading,
    syncing,
    error,
    fetchAll,
    fetchHistory,
    fetchSyncStatus,
    syncNow,
    subscribeToSyncComplete
  }
})
