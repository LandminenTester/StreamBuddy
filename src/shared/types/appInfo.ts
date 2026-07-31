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
