import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { AppLocale, SetupState } from '@shared/types/appInfo'

export const useSetupStore = defineStore('setup', () => {
  const state = ref<SetupState>({ completed: false, version: 0 })
  const isLoaded = ref(false)

  async function fetchState(): Promise<SetupState> {
    state.value = await window.api.invoke('app:getSetupState', undefined)
    isLoaded.value = true
    return state.value
  }

  async function complete(locale: AppLocale): Promise<void> {
    state.value = await window.api.invoke('app:completeSetup', { locale })
  }

  async function reset(): Promise<void> {
    state.value = await window.api.invoke('app:resetSetup', undefined)
  }

  /** Setzt die Bot-Chat-Texte bewusst auf die Standardtexte einer Sprache zurueck. */
  async function resetBotTexts(locale: AppLocale): Promise<void> {
    await window.api.invoke('app:resetBotTexts', { locale })
  }

  return { state, isLoaded, fetchState, complete, reset, resetBotTexts }
})
