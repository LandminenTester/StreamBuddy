import { readFileSync } from 'fs'
import { join } from 'path'
import { app } from 'electron'
import type { ChangelogEntry, ChangelogItem, ChangelogSection } from '@shared/types/appInfo'
import { logger } from './logger'

const REMOTE_CHANGELOG_URL =
  'https://raw.githubusercontent.com/LandminenTester/StreamBuddy/main/CHANGELOG.md'
const REMOTE_CHANGELOG_TIMEOUT_MS = 5_000
const VERSION_HEADER = /^##\s+(?:\[([^\]]+)]\([^)]*\)|(\S+))\s*(?:\(([^)]+)\))?\s*$/
const SECTION_HEADER = /^###\s+(.+)$/
const BULLET_LINE = /^\*\s+(.+)$/
// scripts/release.mjs haengt bei Bullets mit referenzierter Issue/PR sowohl einen
// "([#15](.../issues/15))"- als auch einen "([hash](.../commit/hash))"-Link an --
// beide Gruppen muessen entfernt werden, nicht nur die letzte.
const TRAILING_LINKS = /(?:\s*\(\[[^\]]+]\([^)]*\)\))+\s*$/
const SCOPE_PREFIX = /^\*\*([^*]+):\*\*\s*/

function parseBullet(raw: string): ChangelogItem {
  const withoutLink = raw.replace(TRAILING_LINKS, '').trim()
  const scopeMatch = withoutLink.match(SCOPE_PREFIX)
  if (!scopeMatch) return { scope: null, text: withoutLink }
  return { scope: scopeMatch[1], text: withoutLink.slice(scopeMatch[0].length) }
}

/**
 * Parst das von scripts/release.mjs erzeugte CHANGELOG.md-Format (Conventional Commits,
 * `## [x.y.z](compare-url) (Datum)` bzw. `## x.y.z (Datum)` fuers allererste Release,
 * gefolgt von `### Features`/`### Bug Fixes`-Abschnitten mit `* **scope:** text ([hash](url))`-
 * Bullets). Absichtlich ein schlanker eigener Parser statt einer Markdown-Bibliothek --
 * das Format ist stabil und die Ausgabe wird direkt mit Tailwind gerendert, kein HTML-Injection.
 */
export function parseChangelog(raw: string): ChangelogEntry[] {
  const entries: ChangelogEntry[] = []
  let currentEntry: ChangelogEntry | null = null
  let currentSection: ChangelogSection | null = null

  for (const line of raw.split(/\r?\n/)) {
    const versionMatch = line.match(VERSION_HEADER)
    if (versionMatch) {
      currentEntry = {
        version: versionMatch[1] ?? versionMatch[2],
        date: versionMatch[3] ?? null,
        sections: []
      }
      entries.push(currentEntry)
      currentSection = null
      continue
    }

    const sectionMatch = line.match(SECTION_HEADER)
    if (sectionMatch && currentEntry) {
      currentSection = { title: sectionMatch[1].trim(), items: [] }
      currentEntry.sections.push(currentSection)
      continue
    }

    const bulletMatch = line.match(BULLET_LINE)
    if (bulletMatch && currentSection) {
      currentSection.items.push(parseBullet(bulletMatch[1]))
    }
  }

  return entries
}

function getBundledChangelog(): ChangelogEntry[] {
  try {
    const path = join(app.getAppPath(), 'CHANGELOG.md')
    return parseChangelog(readFileSync(path, 'utf-8'))
  } catch (error) {
    logger.warn('Konnte CHANGELOG.md nicht lesen/parsen', error)
    return []
  }
}

async function fetchRemoteChangelog(): Promise<ChangelogEntry[] | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REMOTE_CHANGELOG_TIMEOUT_MS)

  try {
    const response = await fetch(REMOTE_CHANGELOG_URL, {
      cache: 'no-store',
      signal: controller.signal
    })
    if (!response.ok) {
      logger.warn(`Remote-CHANGELOG.md konnte nicht geladen werden: HTTP ${response.status}`)
      return null
    }

    const entries = parseChangelog(await response.text())
    return entries.length > 0 ? entries : null
  } catch (error) {
    logger.warn('Remote-CHANGELOG.md konnte nicht geladen werden', error)
    return null
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Laedt bevorzugt die aktuelle CHANGELOG.md von GitHub, damit installierte aeltere
 * Versionen im About-Dialog neue Releases sehen. Offline/Fehler fallen auf die
 * mitgelieferte Datei zurueck.
 */
export async function getChangelog(): Promise<ChangelogEntry[]> {
  return (await fetchRemoteChangelog()) ?? getBundledChangelog()
}
