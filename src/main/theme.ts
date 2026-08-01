import { nativeTheme } from 'electron'
import type { AccentColor, AppTheme } from '@shared/types/appInfo'
import { getSetting, setSetting } from './db/repositories/appSettings.repo'

const THEME_KEY = 'theme'
const ACCENT_KEY = 'accent_color'

const ACCENT_VALUES: readonly AccentColor[] = ['purple', 'blue', 'orange', 'green', 'neutral']
const DEFAULT_ACCENT: AccentColor = 'purple'

/**
 * Liefert das persistierte Theme. Solange der Nutzer nie umgeschaltet hat, wird die
 * OS-Praeferenz verwendet ('system'), ohne sie zu persistieren.
 */
export function getTheme(): AppTheme {
  const stored = getSetting(THEME_KEY)
  if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  return 'system'
}

export function setTheme(theme: AppTheme): void {
  setSetting(THEME_KEY, theme)
}

/** Synchronisiert den nativen Fensterrahmen (z.B. Windows-Titelleiste) mit dem gewaehlten Theme. */
export function applyTheme(theme: AppTheme): void {
  nativeTheme.themeSource = theme
}

/** Liefert die persistierte Akzentfarbe, Default ist das Twitch-Violett. */
export function getAccent(): AccentColor {
  const stored = getSetting(ACCENT_KEY)
  return ACCENT_VALUES.includes(stored as AccentColor) ? (stored as AccentColor) : DEFAULT_ACCENT
}

export function setAccent(accent: AccentColor): void {
  setSetting(ACCENT_KEY, accent)
}
