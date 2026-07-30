import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Command, CommandInput } from '@shared/types/command'

export const useCommandsStore = defineStore('commands', () => {
  const commands = ref<Command[]>([])
  const isLoading = ref(false)

  async function fetchCommands(): Promise<void> {
    isLoading.value = true
    try {
      commands.value = await window.api.invoke('commands:list', undefined)
    } finally {
      isLoading.value = false
    }
  }

  async function createCommand(input: CommandInput): Promise<void> {
    const created = await window.api.invoke('commands:create', input)
    commands.value.push(created)
  }

  async function updateCommand(id: number, patch: Partial<CommandInput>): Promise<void> {
    const updated = await window.api.invoke('commands:update', { id, patch })
    const index = commands.value.findIndex((c) => c.id === id)
    if (index !== -1) commands.value[index] = updated
  }

  async function deleteCommand(id: number): Promise<void> {
    await window.api.invoke('commands:delete', { id })
    commands.value = commands.value.filter((c) => c.id !== id)
  }

  return { commands, isLoading, fetchCommands, createCommand, updateCommand, deleteCommand }
})
