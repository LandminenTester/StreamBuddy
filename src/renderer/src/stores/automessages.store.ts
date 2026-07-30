import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Automessage, AutomessageInput } from '@shared/types/automessage'

export const useAutomessagesStore = defineStore('automessages', () => {
  const automessages = ref<Automessage[]>([])
  const isLoading = ref(false)

  async function fetchAutomessages(): Promise<void> {
    isLoading.value = true
    try {
      automessages.value = await window.api.invoke('automessages:list', undefined)
    } finally {
      isLoading.value = false
    }
  }

  async function createAutomessage(input: AutomessageInput): Promise<void> {
    const created = await window.api.invoke('automessages:create', input)
    automessages.value.push(created)
  }

  async function updateAutomessage(id: number, patch: Partial<AutomessageInput>): Promise<void> {
    const updated = await window.api.invoke('automessages:update', { id, patch })
    const index = automessages.value.findIndex((a) => a.id === id)
    if (index !== -1) automessages.value[index] = updated
  }

  async function deleteAutomessage(id: number): Promise<void> {
    await window.api.invoke('automessages:delete', { id })
    automessages.value = automessages.value.filter((a) => a.id !== id)
  }

  return {
    automessages,
    isLoading,
    fetchAutomessages,
    createAutomessage,
    updateAutomessage,
    deleteAutomessage
  }
})
