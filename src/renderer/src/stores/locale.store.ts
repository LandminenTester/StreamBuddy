import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { AppLocale } from '@shared/types/appInfo'
import { AVAILABLE_LOCALES, FALLBACK_LOCALE, applyLocale } from '@renderer/i18n'

export const useLocaleStore = defineStore('locale', () => {
  const locale = ref<AppLocale>(FALLBACK_LOCALE)

  const available = AVAILABLE_LOCALES

  async function init(): Promise<void> {
    locale.value = await window.api.invoke('app:getLocale', undefined)
    applyLocale(locale.value)
  }

  async function setLocale(value: AppLocale): Promise<void> {
    locale.value = value
    applyLocale(value)
    await window.api.invoke('app:setLocale', { locale: value })
  }

  return { locale, available, init, setLocale }
})
