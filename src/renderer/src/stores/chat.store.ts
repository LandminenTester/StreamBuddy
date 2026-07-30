import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ChatConnectionStatus } from '@shared/types/chat'

export const useChatStore = defineStore('chat', () => {
  const status = ref<ChatConnectionStatus>({ connected: false, channel: null, lastError: null })
  const targetChannel = ref('')
  const isSaving = ref(false)

  async function fetchStatus(): Promise<void> {
    status.value = await window.api.invoke('chat:getStatus', undefined)
  }

  async function fetchTargetChannel(): Promise<void> {
    targetChannel.value = (await window.api.invoke('chat:getTargetChannel', undefined)) ?? ''
  }

  async function saveTargetChannel(channel: string): Promise<void> {
    isSaving.value = true
    try {
      status.value = await window.api.invoke('chat:setTargetChannel', { channel })
      targetChannel.value = channel
    } finally {
      isSaving.value = false
    }
  }

  function subscribeToStatusChanges(): () => void {
    return window.api.on('chat:onStatusChanged', (payload) => {
      status.value = payload
    })
  }

  return {
    status,
    targetChannel,
    isSaving,
    fetchStatus,
    fetchTargetChannel,
    saveTargetChannel,
    subscribeToStatusChanges
  }
})
