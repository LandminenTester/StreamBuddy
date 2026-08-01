import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { AccentColor, AppTheme } from '@shared/types/appInfo'
import { DEFAULT_ACCENT, applyAccent } from '@renderer/theme/accents'

const darkMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

function resolveIsDark(theme: AppTheme): boolean {
  if (theme === 'system') return darkMediaQuery.matches
  return theme === 'dark'
}

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<AppTheme>('system')
  const accent = ref<AccentColor>(DEFAULT_ACCENT)

  /** Ob aktuell tatsaechlich dunkel dargestellt wird -- bei 'system' aus der OS-Praeferenz. */
  const isDark = computed(() => resolveIsDark(theme.value))

  /**
   * Setzt die .dark-Klasse und schreibt den Akzent passend zum aufgeloesten Modus,
   * da jeder Akzent eine eigene Light- und Dark-Variante hat.
   */
  function apply(): void {
    const dark = resolveIsDark(theme.value)
    document.documentElement.classList.toggle('dark', dark)
    applyAccent(accent.value, dark)
  }

  async function init(): Promise<void> {
    const [storedTheme, storedAccent] = await Promise.all([
      window.api.invoke('app:getTheme', undefined),
      window.api.invoke('app:getAccent', undefined)
    ])
    theme.value = storedTheme
    accent.value = storedAccent
    apply()

    // Bei 'system' muss ein OS-seitiger Wechsel live durchschlagen.
    darkMediaQuery.addEventListener('change', () => {
      if (theme.value === 'system') apply()
    })
  }

  async function setTheme(value: AppTheme): Promise<void> {
    theme.value = value
    apply()
    await window.api.invoke('app:setTheme', { theme: value })
  }

  async function setAccent(value: AccentColor): Promise<void> {
    accent.value = value
    apply()
    await window.api.invoke('app:setAccent', { accent: value })
  }

  /** Schaltet explizit zwischen hell und dunkel -- 'system' wird dabei aufgeloest. */
  async function toggle(): Promise<void> {
    await setTheme(isDark.value ? 'light' : 'dark')
  }

  return { theme, accent, isDark, init, setTheme, setAccent, toggle }
})
