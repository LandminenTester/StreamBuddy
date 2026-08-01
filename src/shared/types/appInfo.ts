export interface ChangelogItem {
  scope: string | null
  text: string
}

export interface ChangelogSection {
  title: string
  items: ChangelogItem[]
}

export interface ChangelogEntry {
  version: string
  date: string | null
  sections: ChangelogSection[]
}

export type UpdateState =
  'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error'

export interface UpdateStatus {
  state: UpdateState
  version?: string
  percent?: number
  message?: string
}

export interface AppMetadata {
  author: string
  license: string
  repositoryUrl: string | null
}

export type AppTheme = 'light' | 'dark' | 'system'

/** Waehlbare Akzentfarbe; die konkreten Werte liegen in src/renderer/src/theme/accents.ts. */
export type AccentColor = 'purple' | 'blue' | 'orange' | 'green' | 'neutral'

/**
 * Sprache der Oberflaeche. 'de' ist Master und Fallback -- fehlt ein Key in einer
 * anderen Sprache, wird der deutsche Text angezeigt.
 */
export type AppLocale = 'de' | 'en'

/** Zustand der gefuehrten Ersteinrichtung. */
export interface SetupState {
  completed: boolean
  /** Version des zuletzt durchlaufenen Wizards; 0 = nie durchlaufen. */
  version: number
}
