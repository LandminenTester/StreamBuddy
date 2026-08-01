import type { AppLocale, SetupState } from '@shared/types/appInfo'
import { getSetting, setSetting } from './db/repositories/appSettings.repo'
import { seedBotTextsForLocale } from './loyalty/botTexts'
import { setLocale } from './locale'

const COMPLETED_KEY = 'setup_completed'
const VERSION_KEY = 'setup_version'

/**
 * Version des Einrichtungsablaufs. Wird erhoeht, sobald der Wizard Schritte
 * bekommt, die bestehende Installationen noch nicht durchlaufen haben -- dann kann
 * gezielt zum Nachholen aufgefordert werden, ohne alles zurueckzusetzen.
 */
export const CURRENT_SETUP_VERSION = 1

export function getSetupState(): SetupState {
  return {
    completed: getSetting(COMPLETED_KEY) === '1',
    version: Number(getSetting(VERSION_KEY) ?? 0)
  }
}

/**
 * Schliesst die Einrichtung ab: setzt die gewaehlte Sprache verbindlich und seedet
 * die Bot-Chat-Texte einmalig in dieser Sprache.
 * @param locale Im Wizard gewaehlte Sprache
 */
export function completeSetup(locale: AppLocale): SetupState {
  setLocale(locale)
  seedBotTextsForLocale(locale)
  setSetting(COMPLETED_KEY, '1')
  setSetting(VERSION_KEY, String(CURRENT_SETUP_VERSION))
  return getSetupState()
}

/** Setzt nur die Abschluss-Markierung zurueck -- es werden keine Daten geloescht. */
export function resetSetup(): SetupState {
  setSetting(COMPLETED_KEY, '0')
  return getSetupState()
}
