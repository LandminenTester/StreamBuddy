import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { CommandTracker, TrackerInput } from '@shared/types/tracker'

export const useTrackersStore = defineStore('trackers', () => {
  const trackers = ref<CommandTracker[]>([])
  const loading = ref(false)

  async function fetchTrackers(): Promise<void> {
    loading.value = true
    try {
      trackers.value = await window.api.invoke('trackers:list', undefined)
    } finally {
      loading.value = false
    }
  }

  async function createTracker(input: TrackerInput): Promise<CommandTracker> {
    const tracker = await window.api.invoke('trackers:create', input)
    trackers.value = [...trackers.value, tracker]
    return tracker
  }

  async function updateTracker(id: number, patch: Partial<TrackerInput>): Promise<void> {
    const updated = await window.api.invoke('trackers:update', { id, patch })
    trackers.value = trackers.value.map((t) => (t.id === id ? updated : t))
  }

  async function deleteTracker(id: number): Promise<void> {
    await window.api.invoke('trackers:delete', { id })
    trackers.value = trackers.value.filter((t) => t.id !== id)
  }

  async function adjustTracker(id: number, delta: number): Promise<void> {
    const updated = await window.api.invoke('trackers:adjust', { id, delta })
    trackers.value = trackers.value.map((t) => (t.id === id ? updated : t))
  }

  async function setTextValue(id: number, value: string): Promise<void> {
    const updated = await window.api.invoke('trackers:setTextValue', { id, value })
    trackers.value = trackers.value.map((t) => (t.id === id ? updated : t))
  }

  return {
    trackers,
    loading,
    fetchTrackers,
    createTracker,
    updateTracker,
    deleteTracker,
    adjustTracker,
    setTextValue
  }
})
