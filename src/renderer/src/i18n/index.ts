import { createI18n } from 'vue-i18n'
import type { AppLocale } from '@shared/types/appInfo'
import de from './locales/de.json'
import en from './locales/en.json'

/**
 * Deutsch ist Master-Sprache und Fallback: fehlt ein Key in einer anderen Locale,
 * greift automatisch der deutsche Text, statt den rohen Key anzuzeigen.
 */
export const FALLBACK_LOCALE: AppLocale = 'de'

/** Sprachen mit ihrem Namen in der jeweiligen Sprache selbst. */
export const AVAILABLE_LOCALES: { value: AppLocale; label: string }[] = [
  { value: 'de', label: 'Deutsch' },
  { value: 'en', label: 'English' }
]

export const i18n = createI18n({
  legacy: false,
  locale: FALLBACK_LOCALE,
  fallbackLocale: FALLBACK_LOCALE,
  messages: { de, en },
  datetimeFormats: {
    de: {
      short: {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }
    },
    en: {
      short: {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }
    }
  },
  // Fehlende Keys sind im Betrieb unkritisch (Fallback greift); das Pruefskript
  // scripts/i18n-check.mjs faengt sie vor dem Commit ab.
  missingWarn: import.meta.env.DEV,
  fallbackWarn: false
})

export function isAppLocale(value: unknown): value is AppLocale {
  return AVAILABLE_LOCALES.some((locale) => locale.value === value)
}

/** Setzt die aktive Sprache und zieht das lang-Attribut des Dokuments nach. */
export function applyLocale(locale: AppLocale): void {
  i18n.global.locale.value = locale
  document.documentElement.lang = locale
}

/** Uebersetzt ausserhalb einer Component, z.B. in Store-Actions. */
export const t = i18n.global.t

const LOCALE_TAGS: Record<AppLocale, string> = {
  de: 'de-DE',
  en: 'en-US'
}

/** BCP-47-Tag der aktiven Sprache fuer Intl-Formatierungen (Datum, Zahlen). */
export function activeLocaleTag(): string {
  return LOCALE_TAGS[i18n.global.locale.value as AppLocale] ?? LOCALE_TAGS.de
}
