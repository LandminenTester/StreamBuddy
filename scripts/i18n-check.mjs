#!/usr/bin/env node
/*
 * Prueft die Sprachdateien gegen die Master-Locale de.json:
 *
 *  1. Keys, die im Code per t('...') benutzt werden, aber in de.json fehlen  -> FEHLER
 *  2. Keys, die in einer anderen Locale fehlen                              -> Warnung (Fallback greift)
 *  3. Keys, die in einer Locale stehen, aber nicht mehr in de.json          -> Warnung (verwaist)
 *
 * de.json ist bewusst die einzige Quelle der Wahrheit fuer die Key-Liste --
 * eine separate "Alle-Keys"-Datei waere eine zweite Wahrheit, die auseinanderlaeuft.
 *
 * Aufruf:
 *   node scripts/i18n-check.mjs
 *   node scripts/i18n-check.mjs --write-template   erzeugt locales/_template.json
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, extname, join, relative } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const LOCALES_DIR = join(ROOT, 'src/renderer/src/i18n/locales')
const SOURCE_DIR = join(ROOT, 'src/renderer/src')
const MASTER_LOCALE = 'de'

const writeTemplate = process.argv.includes('--write-template')

/** Flacht ein verschachteltes Message-Objekt zu Punkt-getrennten Keys ab. */
function flatten(object, prefix = '') {
  const result = new Map()
  for (const [key, value] of Object.entries(object)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      for (const [nested, nestedValue] of flatten(value, path)) result.set(nested, nestedValue)
    } else {
      result.set(path, value)
    }
  }
  return result
}

function readLocale(name) {
  return JSON.parse(readFileSync(join(LOCALES_DIR, `${name}.json`), 'utf-8'))
}

function listLocales() {
  return readdirSync(LOCALES_DIR)
    .filter((file) => file.endsWith('.json') && !file.startsWith('_'))
    .map((file) => file.slice(0, -'.json'.length))
}

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      if (entry === 'locales') continue
      walk(full, files)
    } else if (['.vue', '.ts'].includes(extname(entry))) {
      files.push(full)
    }
  }
  return files
}

/*
 * Nur statische String-Literale werden erfasst. Dynamisch zusammengesetzte Keys
 * (Template-Literale wie t(`games.name.${id}`)) lassen sich statisch nicht aufloesen
 * und werden bewusst uebersprungen -- sie sind ueber die Master-Locale abgedeckt.
 */
const USAGE_REGEX = /(?:\$t|[^\w.]t|\bte)\(\s*(['"])([\w.]+?)\1/g

function collectUsedKeys() {
  const used = new Map()
  for (const file of walk(SOURCE_DIR)) {
    const content = readFileSync(file, 'utf-8')
    for (const match of content.matchAll(USAGE_REGEX)) {
      const key = match[2]
      if (!used.has(key)) used.set(key, relative(ROOT, file).replace(/\\/g, '/'))
    }
  }
  return used
}

function main() {
  const master = flatten(readLocale(MASTER_LOCALE))
  const masterKeys = new Set(master.keys())

  if (writeTemplate) {
    const template = Object.fromEntries([...masterKeys].sort().map((key) => [key, '']))
    const path = join(LOCALES_DIR, '_template.json')
    writeFileSync(path, `${JSON.stringify(template, null, 2)}\n`)
    console.log(`_template.json mit ${masterKeys.size} Keys geschrieben: ${relative(ROOT, path)}`)
    return
  }

  let errors = 0
  let warnings = 0

  // 1. Im Code benutzte, aber nicht definierte Keys
  for (const [key, file] of collectUsedKeys()) {
    if (!masterKeys.has(key)) {
      console.error(`FEHLER  Key '${key}' wird in ${file} benutzt, fehlt aber in ${MASTER_LOCALE}.json`)
      errors += 1
    }
  }

  // 2./3. Abgleich der uebrigen Locales gegen die Master-Locale
  for (const locale of listLocales()) {
    if (locale === MASTER_LOCALE) continue
    const keys = new Set(flatten(readLocale(locale)).keys())

    for (const key of masterKeys) {
      if (!keys.has(key)) {
        console.warn(`WARNUNG ${locale}.json: Key '${key}' fehlt (Fallback auf ${MASTER_LOCALE})`)
        warnings += 1
      }
    }
    for (const key of keys) {
      if (!masterKeys.has(key)) {
        console.warn(`WARNUNG ${locale}.json: Key '${key}' ist verwaist (nicht mehr in ${MASTER_LOCALE}.json)`)
        warnings += 1
      }
    }
  }

  console.log(
    `\n${masterKeys.size} Keys in ${MASTER_LOCALE}.json -- ${errors} Fehler, ${warnings} Warnungen`
  )
  if (errors > 0) process.exitCode = 1
}

main()
