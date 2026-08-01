import type { AccentColor } from '@shared/types/appInfo'

/**
 * Ein Akzent-Eintrag haelt je Modus die Akzentfarbe und die darauf lesbare
 * Vordergrundfarbe -- beides als RGB-Tripel, damit es direkt in die
 * CSS-Custom-Properties --accent / --accent-fg geschrieben werden kann.
 */
export interface AccentDefinition {
  /** i18n-Key fuer das Label in der Auswahl. */
  labelKey: string
  light: { accent: string; accentFg: string }
  dark: { accent: string; accentFg: string }
}

const WHITE = '255 255 255'
const NEAR_BLACK = '10 10 10'

/**
 * Im Dark-Mode wird jeweils eine hellere Variante genutzt, damit der Kontrast
 * gegen den dunklen Hintergrund stimmt. Weil diese hellen Toene weissen Text
 * nicht mehr tragen, kippt accentFg dort auf Fast-Schwarz.
 */
export const ACCENTS: Record<AccentColor, AccentDefinition> = {
  purple: {
    labelKey: 'settings.appearance.accent.purple',
    light: { accent: '145 70 255', accentFg: WHITE }, // #9146FF -- Twitch-Violett
    dark: { accent: '169 112 255', accentFg: NEAR_BLACK }
  },
  blue: {
    labelKey: 'settings.appearance.accent.blue',
    light: { accent: '37 99 235', accentFg: WHITE }, // blue-600
    dark: { accent: '96 165 250', accentFg: NEAR_BLACK } // blue-400
  },
  orange: {
    labelKey: 'settings.appearance.accent.orange',
    light: { accent: '234 88 12', accentFg: WHITE }, // orange-600
    dark: { accent: '251 146 60', accentFg: NEAR_BLACK } // orange-400
  },
  green: {
    labelKey: 'settings.appearance.accent.green',
    light: { accent: '5 150 105', accentFg: WHITE }, // emerald-600
    dark: { accent: '52 211 153', accentFg: NEAR_BLACK } // emerald-400
  },
  neutral: {
    labelKey: 'settings.appearance.accent.neutral',
    light: { accent: '71 85 105', accentFg: WHITE }, // slate-600
    dark: { accent: '148 163 184', accentFg: NEAR_BLACK } // slate-400
  }
}

export const ACCENT_KEYS = Object.keys(ACCENTS) as AccentColor[]

export const DEFAULT_ACCENT: AccentColor = 'purple'

export function isAccentColor(value: unknown): value is AccentColor {
  return typeof value === 'string' && value in ACCENTS
}

/**
 * Schreibt --accent / --accent-fg auf das <html>-Element.
 * @param accent Gewaehlter Akzent
 * @param isDark Ob gerade der Dark-Mode aktiv ist
 */
export function applyAccent(accent: AccentColor, isDark: boolean): void {
  const variant = ACCENTS[accent][isDark ? 'dark' : 'light']
  const root = document.documentElement
  root.style.setProperty('--accent', variant.accent)
  root.style.setProperty('--accent-fg', variant.accentFg)
}

/** Liest den aktuell gesetzten Akzent als CSS-rgb()-String, z.B. fuer Chart.js. */
export function readAccentRgb(alpha = 1): string {
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()
  const triple = raw || ACCENTS[DEFAULT_ACCENT].light.accent
  return alpha === 1 ? `rgb(${triple})` : `rgb(${triple} / ${alpha})`
}
