import { nativeTheme } from 'electron'
import type { AppTheme } from '@shared/types/appInfo'
import { getSetting, setSetting } from './db/repositories/appSettings.repo'

const THEME_KEY = 'theme'

/**
 * Liefert das persistierte Theme. Solange der Nutzer nie umgeschaltet hat, wird die
 * OS-Praeferenz als Default verwendet, ohne sie zu persistieren.
 */
export function getTheme(): AppTheme {
  const stored = getSetting(THEME_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
}

export function setTheme(theme: AppTheme): void {
  setSetting(THEME_KEY, theme)
}

/** Synchronisiert den nativen Fensterrahmen (z.B. Windows-Titelleiste) mit dem gewaehlten Theme. */
export function applyTheme(theme: AppTheme): void {
  nativeTheme.themeSource = theme
}
