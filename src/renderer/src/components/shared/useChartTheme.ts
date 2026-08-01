import { computed, type ComputedRef } from 'vue'
import { useThemeStore } from '@renderer/stores/theme.store'
import { readAccentRgb } from '@renderer/theme/accents'

export interface ChartTheme {
  accent: string
  accentFill: string
  tick: string
  grid: string
}

function readToken(name: string, alpha = 1): string {
  const triple = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  if (!triple) return 'rgb(100 116 139)'
  return alpha === 1 ? `rgb(${triple})` : `rgb(${triple} / ${alpha})`
}

/**
 * Liefert die Chart-Farben aus den aktiven Design-Tokens. Die Abhaengigkeit auf
 * accent/isDark sorgt dafuer, dass Chart.js nach einem Theme- oder Akzentwechsel
 * neu zeichnet -- die CSS-Variablen sind zu diesem Zeitpunkt bereits geschrieben.
 */
export function useChartTheme(): ComputedRef<ChartTheme> {
  const themeStore = useThemeStore()

  return computed<ChartTheme>(() => {
    // Bewusste Abhaengigkeiten, damit das computed bei jedem Wechsel neu laeuft.
    void themeStore.accent
    void themeStore.isDark

    return {
      accent: readAccentRgb(),
      accentFill: readAccentRgb(0.15),
      tick: readToken('--fg-muted'),
      grid: readToken('--border')
    }
  })
}
