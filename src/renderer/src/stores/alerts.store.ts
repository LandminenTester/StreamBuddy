import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Effect, EffectInput } from '@shared/types/alert'

export const useAlertsStore = defineStore('alerts', () => {
  const effects = ref<Effect[]>([])
  const serverPort = ref(0)
  const isLoading = ref(false)
  const isSaving = ref(false)

  async function fetchEffects(): Promise<void> {
    isLoading.value = true
    try {
      effects.value = await window.api.invoke('alerts:list', undefined)
    } finally {
      isLoading.value = false
    }
  }

  async function fetchServerPort(): Promise<void> {
    serverPort.value = await window.api.invoke('alerts:getServerPort', undefined)
  }

  async function createEffect(input: EffectInput): Promise<void> {
    isSaving.value = true
    try {
      const created = await window.api.invoke('alerts:create', input)
      effects.value.push(created)
    } finally {
      isSaving.value = false
    }
  }

  async function updateEffect(id: number, patch: Partial<EffectInput>): Promise<void> {
    isSaving.value = true
    try {
      const updated = await window.api.invoke('alerts:update', { id, patch })
      const index = effects.value.findIndex((e) => e.id === id)
      if (index !== -1) effects.value[index] = updated
    } finally {
      isSaving.value = false
    }
  }

  async function deleteEffect(id: number): Promise<void> {
    await window.api.invoke('alerts:delete', { id })
    effects.value = effects.value.filter((e) => e.id !== id)
  }

  async function triggerEffect(id: number): Promise<void> {
    await window.api.invoke('alerts:trigger', { id })
  }

  async function pickVideoFile(): Promise<string | null> {
    return window.api.invoke('alerts:pickVideoFile', undefined)
  }

  async function pickAudioFile(): Promise<string | null> {
    return window.api.invoke('alerts:pickAudioFile', undefined)
  }

  const overlayUrl = computed(() => (id: number) =>
    serverPort.value ? `http://localhost:${serverPort.value}/overlay?effectId=${id}` : ''
  )

  return {
    effects,
    serverPort,
    isLoading,
    isSaving,
    overlayUrl,
    fetchEffects,
    fetchServerPort,
    createEffect,
    updateEffect,
    deleteEffect,
    triggerEffect,
    pickVideoFile,
    pickAudioFile
  }
})
