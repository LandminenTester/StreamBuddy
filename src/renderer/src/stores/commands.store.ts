import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { BuiltInCommandInfo, Command, CommandInput } from '@shared/types/command'

export const useCommandsStore = defineStore('commands', () => {
  const commands = ref<Command[]>([])
  const isLoading = ref(false)
  const builtInCommands = ref<BuiltInCommandInfo[]>([])

  async function fetchCommands(): Promise<void> {
    isLoading.value = true
    try {
      commands.value = await window.api.invoke('commands:list', undefined)
    } finally {
      isLoading.value = false
    }
  }

  async function createCommand(input: CommandInput): Promise<void> {
    const created = await window.api.invoke('commands:create', toIpcCommandInput(input))
    commands.value.push(created)
  }

  async function updateCommand(id: number, patch: Partial<CommandInput>): Promise<void> {
    const updated = await window.api.invoke('commands:update', { id, patch: toIpcCommandPatch(patch) })
    const index = commands.value.findIndex((c) => c.id === id)
    if (index !== -1) commands.value[index] = updated
  }

  function toIpcCommandInput(input: CommandInput): CommandInput {
    return {
      ...input,
      aliases: [...input.aliases],
      trackerActions: input.trackerActions?.map((action) => ({
        trackerId: Number(action.trackerId),
        action: action.action
      }))
    }
  }

  function toIpcCommandPatch(patch: Partial<CommandInput>): Partial<CommandInput> {
    return {
      ...patch,
      aliases: patch.aliases ? [...patch.aliases] : patch.aliases,
      trackerActions: patch.trackerActions?.map((action) => ({
        trackerId: Number(action.trackerId),
        action: action.action
      }))
    }
  }

  async function deleteCommand(id: number): Promise<void> {
    await window.api.invoke('commands:delete', { id })
    commands.value = commands.value.filter((c) => c.id !== id)
  }

  async function fetchBuiltInCommands(): Promise<void> {
    builtInCommands.value = await window.api.invoke('commands:listBuiltIn', undefined)
  }

  async function setBuiltInEnabled(key: string, enabled: boolean): Promise<void> {
    builtInCommands.value = await window.api.invoke('commands:setBuiltInEnabled', {
      key,
      enabled
    })
  }

  return {
    commands,
    isLoading,
    builtInCommands,
    fetchCommands,
    createCommand,
    updateCommand,
    deleteCommand,
    fetchBuiltInCommands,
    setBuiltInEnabled
  }
})
