import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Poll, PollCreateInput } from '@shared/types/poll'

export const usePollsStore = defineStore('polls', () => {
  const polls = ref<Poll[]>([])
  const isCreating = ref(false)
  const error = ref<string | null>(null)

  async function fetchPolls(): Promise<void> {
    polls.value = await window.api.invoke('polls:list', undefined)
  }

  async function createPoll(input: PollCreateInput): Promise<void> {
    isCreating.value = true
    error.value = null
    try {
      const created = await window.api.invoke('polls:create', input)
      polls.value.unshift(created)
    } catch (err) {
      error.value = (err as Error).message
    } finally {
      isCreating.value = false
    }
  }

  async function endPoll(id: number, winnerChoiceIndex?: number | null): Promise<void> {
    const updated = await window.api.invoke('polls:end', { id, winnerChoiceIndex })
    const index = polls.value.findIndex((p) => p.id === id)
    if (index !== -1) polls.value[index] = updated
  }

  async function resetPoll(id: number): Promise<void> {
    const updated = await window.api.invoke('polls:reset', { id })
    const index = polls.value.findIndex((p) => p.id === id)
    if (index !== -1) polls.value[index] = updated
  }

  function subscribeToUpdates(): () => void {
    return window.api.on('polls:onUpdate', (updatedPoll) => {
      const index = polls.value.findIndex((p) => p.id === updatedPoll.id)
      if (index !== -1) polls.value[index] = updatedPoll
      else polls.value.unshift(updatedPoll)
    })
  }

  return {
    polls,
    isCreating,
    error,
    fetchPolls,
    createPoll,
    endPoll,
    resetPoll,
    subscribeToUpdates
  }
})
