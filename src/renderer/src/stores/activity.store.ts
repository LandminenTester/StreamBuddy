import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ActivityEvent, ActivityEventType, ActivityListRequest } from '@shared/types/activity'

export const useActivityStore = defineStore('activity', () => {
  const events = ref<ActivityEvent[]>([])
  const isLoading = ref(false)

  async function fetchEvents(request: ActivityListRequest = {}): Promise<void> {
    isLoading.value = true
    try {
      events.value = await window.api.invoke('activity:list', request)
    } finally {
      isLoading.value = false
    }
  }

  async function clearEvents(): Promise<void> {
    await window.api.invoke('activity:clear', undefined)
    events.value = []
  }

  function subscribeToEvents(): () => void {
    return window.api.on('activity:onEvent', (event) => {
      events.value = [event, ...events.value].slice(0, 100)
    })
  }

  function filterLocal(eventTypes: ActivityEventType[]): ActivityEvent[] {
    if (eventTypes.length === 0) return events.value
    return events.value.filter((event) => eventTypes.includes(event.eventType))
  }

  return {
    events,
    isLoading,
    fetchEvents,
    clearEvents,
    subscribeToEvents,
    filterLocal
  }
})
