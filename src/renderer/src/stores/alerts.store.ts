import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Effect, EffectInput } from '@shared/types/alert'
import type { AlertRule, AlertRuleInput } from '@shared/types/alertRule'

export const useAlertsStore = defineStore('alerts', () => {
  const effects = ref<Effect[]>([])
  const serverPort = ref(0)
  const isLoading = ref(false)
  const isSaving = ref(false)

  const rules = ref<AlertRule[]>([])
  const isMuted = ref(false)

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

  const alertsOverlayUrl = computed(() =>
    serverPort.value ? `http://localhost:${serverPort.value}/alerts-overlay` : ''
  )

  async function fetchAlertRules(): Promise<void> {
    isLoading.value = true
    try {
      rules.value = await window.api.invoke('alerts:manager:list', undefined)
    } finally {
      isLoading.value = false
    }
  }

  async function createAlertRule(input: AlertRuleInput): Promise<void> {
    isSaving.value = true
    try {
      const created = await window.api.invoke('alerts:manager:create', input)
      rules.value.push(created)
    } finally {
      isSaving.value = false
    }
  }

  async function updateAlertRule(id: number, patch: Partial<AlertRuleInput>): Promise<void> {
    isSaving.value = true
    try {
      const updated = await window.api.invoke('alerts:manager:update', { id, patch })
      const index = rules.value.findIndex((r) => r.id === id)
      if (index !== -1) rules.value[index] = updated
    } finally {
      isSaving.value = false
    }
  }

  async function deleteAlertRule(id: number): Promise<void> {
    await window.api.invoke('alerts:manager:delete', { id })
    rules.value = rules.value.filter((r) => r.id !== id)
  }

  async function testAlertRule(id: number): Promise<void> {
    await window.api.invoke('alerts:manager:test', { id })
  }

  async function fetchMuted(): Promise<void> {
    isMuted.value = await window.api.invoke('alerts:manager:getMuted', undefined)
  }

  async function setMuted(muted: boolean): Promise<void> {
    await window.api.invoke('alerts:manager:setMuted', { muted })
    isMuted.value = muted
  }

  async function clearAlertQueue(): Promise<void> {
    await window.api.invoke('alerts:manager:clearQueue', undefined)
  }

  async function pickManagerMediaFile(): Promise<string | null> {
    return window.api.invoke('alerts:manager:pickMediaFile', undefined)
  }

  async function pickManagerAudioFile(): Promise<string | null> {
    return window.api.invoke('alerts:manager:pickAudioFile', undefined)
  }

  return {
    effects,
    serverPort,
    isLoading,
    isSaving,
    overlayUrl,
    alertsOverlayUrl,
    fetchEffects,
    fetchServerPort,
    createEffect,
    updateEffect,
    deleteEffect,
    triggerEffect,
    pickVideoFile,
    pickAudioFile,
    rules,
    isMuted,
    fetchAlertRules,
    createAlertRule,
    updateAlertRule,
    deleteAlertRule,
    testAlertRule,
    fetchMuted,
    setMuted,
    clearAlertQueue,
    pickManagerMediaFile,
    pickManagerAudioFile
  }
})
