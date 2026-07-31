#!/usr/bin/env node
// Ersetzt release-please: berechnet Version + Changelog aus Conventional-Commits seit dem
// letzten Tag und schreibt sie direkt (kein Review-PR). Erzeugt CHANGELOG.md-Eintraege im
// exakten Format, das src/main/changelog.ts parst.
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const PACKAGE_JSON_PATH = join(ROOT, 'package.json')
const CHANGELOG_PATH = join(ROOT, 'CHANGELOG.md')
const RELEASE_NOTES_PATH = join(ROOT, '.release-notes.md')
const REPO_URL = 'https://github.com/LandminenTester/StreamingBot'

const isDryRun = process.argv.includes('--dry-run')

const COMMIT_REGEX = /^(\w+)(?:\(([^)]+)\))?(!)?:\s*(.+?)\s*(?:\(#(\d+)\))?$/
const SECTION_BY_TYPE = { feat: 'Features', fix: 'Bug Fixes' }
const BUMP_BY_TYPE = { feat: 'minor', fix: 'patch' }

function git(args) {
  return execFileSync('git', args, { cwd: ROOT, encoding: 'utf-8' }).trim()
}

function getLastTag() {
  try {
    return git(['describe', '--tags', '--abbrev=0', '--match', 'v*'])
  } catch {
    return null
  }
}

function getCommitsSince(lastTag) {
  const range = lastTag ? `${lastTag}..HEAD` : 'HEAD'
  const raw = git(['log', range, '--pretty=format:%H%x1f%s'])
  if (!raw) return []
  return raw.split('\n').map((line) => {
    const [hash, subject] = line.split('\x1f')
    return { hash, subject }
  })
}

function parseCommit({ hash, subject }) {
  const match = subject.match(COMMIT_REGEX)
  if (!match) return null
  const [, type, scope, breaking, description, prNumber] = match
  return { hash, type, scope: scope ?? null, breaking: Boolean(breaking), description, prNumber }
}

function bumpVersion(current, bump) {
  const [major, minor, patch] = current.split('.').map(Number)
  if (bump === 'major') return `${major + 1}.0.0`
  if (bump === 'minor') return `${major}.${minor + 1}.0`
  return `${major}.${minor}.${patch + 1}`
}

function formatBullet(commit) {
  const scopePrefix = commit.scope ? `**${commit.scope}:** ` : ''
  const prLink = commit.prNumber
    ? ` ([#${commit.prNumber}](${REPO_URL}/issues/${commit.prNumber}))`
    : ''
  const commitLink = ` ([${commit.hash.slice(0, 7)}](${REPO_URL}/commit/${commit.hash}))`
  return `* ${scopePrefix}${commit.description}${prLink}${commitLink}`
}

function buildChangelogEntry(version, lastTag, sections, date) {
  const compareUrl = lastTag
    ? `${REPO_URL}/compare/${lastTag}...v${version}`
    : `${REPO_URL}/releases/tag/v${version}`
  const lines = [`## [${version}](${compareUrl}) (${date})`, '', '']

  for (const [type, title] of Object.entries(SECTION_BY_TYPE)) {
    const commits = sections[type]
    if (!commits || commits.length === 0) continue
    lines.push(`### ${title}`, '')
    for (const commit of commits) lines.push(formatBullet(commit))
    lines.push('')
  }

  return lines.join('\n').trimEnd() + '\n'
}

function main() {
  const lastTag = getLastTag()
  const commits = getCommitsSince(lastTag).map(parseCommit).filter(Boolean)

  const sections = { feat: [], fix: [] }
  let bump = null
  for (const commit of commits) {
    if (!(commit.type in SECTION_BY_TYPE)) continue
    sections[commit.type].push(commit)
    if (commit.breaking) bump = 'major'
    else if (bump !== 'major' && BUMP_BY_TYPE[commit.type] === 'minor') bump = 'minor'
    else if (!bump) bump = 'patch'
  }

  if (!bump) {
    console.log('Keine feat/fix-Commits seit dem letzten Tag -- kein Release noetig.')
    if (process.env.GITHUB_OUTPUT) {
      writeFileSync(process.env.GITHUB_OUTPUT, 'released=false\n', { flag: 'a' })
    }
    return
  }

  const pkg = readFileSync(PACKAGE_JSON_PATH, 'utf-8')
  const currentVersion = JSON.parse(pkg).version
  const nextVersion = bumpVersion(currentVersion, bump)
  const date = new Date().toISOString().slice(0, 10)
  const entry = buildChangelogEntry(nextVersion, lastTag, sections, date)

  console.log(`Naechste Version: ${currentVersion} -> ${nextVersion} (${bump})\n`)
  console.log(entry)

  if (isDryRun) {
    console.log('(--dry-run: es wurde nichts geschrieben)')
    return
  }

  const updatedPkg = pkg.replace(
    /"version":\s*"[^"]+"/,
    `"version": "${nextVersion}"`
  )
  writeFileSync(PACKAGE_JSON_PATH, updatedPkg)

  // Windows-Runner checken mit CRLF aus -- rein textuell in \n normalisieren, damit die
  // Kopfzeilen-Erkennung nicht an \r\n\r\n vorbeisucht, dann konsistent zurueckkonvertieren.
  const rawChangelog = readFileSync(CHANGELOG_PATH, 'utf-8')
  const usesCrlf = rawChangelog.includes('\r\n')
  const changelog = rawChangelog.replace(/\r\n/g, '\n')
  const headerEnd = changelog.indexOf('\n\n') + 2
  const updatedChangelog =
    changelog.slice(0, headerEnd) + entry + '\n' + changelog.slice(headerEnd)
  writeFileSync(
    CHANGELOG_PATH,
    usesCrlf ? updatedChangelog.replace(/\n/g, '\r\n') : updatedChangelog
  )

  writeFileSync(RELEASE_NOTES_PATH, entry)

  if (process.env.GITHUB_OUTPUT) {
    writeFileSync(
      process.env.GITHUB_OUTPUT,
      `released=true\nversion=${nextVersion}\ntag=v${nextVersion}\n`,
      { flag: 'a' }
    )
  }
}

main()
