import { app } from 'electron'
import type { AppLocale } from '@shared/types/appInfo'
import { getSetting, setSetting } from './db/repositories/appSettings.repo'

const LOCALE_KEY = 'ui_locale'

const LOCALES: readonly AppLocale[] = ['de', 'en']
const DEFAULT_LOCALE: AppLocale = 'de'

/**
 * Liefert die persistierte Oberflaechensprache. Solange der Nutzer nie gewaehlt hat
 * (also vor dem Setup), wird die OS-Sprache als Vorschlag genutzt, ohne sie zu
 * persistieren -- verbindlich gesetzt wird sie erst im Setup-Wizard.
 */
export function getLocale(): AppLocale {
  const stored = getSetting(LOCALE_KEY)
  if (LOCALES.includes(stored as AppLocale)) return stored as AppLocale

  const systemLocale = app.getLocale().slice(0, 2).toLowerCase()
  return LOCALES.includes(systemLocale as AppLocale) ? (systemLocale as AppLocale) : DEFAULT_LOCALE
}

export function setLocale(locale: AppLocale): void {
  setSetting(LOCALE_KEY, locale)
}
