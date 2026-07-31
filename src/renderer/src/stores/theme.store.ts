import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { AppTheme } from '@shared/types/appInfo'

function applyThemeClass(theme: AppTheme): void {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<AppTheme>('light')

  async function init(): Promise<void> {
    theme.value = await window.api.invoke('app:getTheme', undefined)
    applyThemeClass(theme.value)
  }

  async function setTheme(value: AppTheme): Promise<void> {
    theme.value = value
    applyThemeClass(value)
    await window.api.invoke('app:setTheme', { theme: value })
  }

  async function toggle(): Promise<void> {
    await setTheme(theme.value === 'dark' ? 'light' : 'dark')
  }

  return { theme, init, setTheme, toggle }
})
