import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ChatConnectionStatus, ChatFeedMessage } from '@shared/types/chat'

const MAX_FEED_MESSAGES = 200

export const useChatStore = defineStore('chat', () => {
  const status = ref<ChatConnectionStatus>({ connected: false, channel: null, lastError: null })
  const targetChannel = ref('')
  const isSaving = ref(false)
  const autoConnect = ref(true)
  const isConnecting = ref(false)
  const messages = ref<ChatFeedMessage[]>([])

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

  async function fetchAutoConnect(): Promise<void> {
    autoConnect.value = await window.api.invoke('chat:getAutoConnect', undefined)
  }

  async function setAutoConnect(enabled: boolean): Promise<void> {
    autoConnect.value = await window.api.invoke('chat:setAutoConnect', { enabled })
  }

  async function connectNow(): Promise<void> {
    isConnecting.value = true
    try {
      status.value = await window.api.invoke('chat:connect', undefined)
    } finally {
      isConnecting.value = false
    }
  }

  function subscribeToMessages(): () => void {
    return window.api.on('chat:onMessage', (payload) => {
      messages.value = [...messages.value, payload].slice(-MAX_FEED_MESSAGES)
    })
  }

  return {
    status,
    targetChannel,
    isSaving,
    autoConnect,
    isConnecting,
    messages,
    fetchStatus,
    fetchTargetChannel,
    saveTargetChannel,
    subscribeToStatusChanges,
    fetchAutoConnect,
    setAutoConnect,
    connectNow,
    subscribeToMessages
  }
})
