import { getSetting, setSetting } from '../../db/repositories/appSettings.repo'

const DISABLED_KEY = 'builtin_commands_disabled'

/**
 * Ein-/Ausschaltbarkeit der vom Bot fest vorgegebenen Commands (Loyalty-Kern +
 * Spiele-Befehle), getrennt von den frei konfigurierbaren Custom-Commands.
 * Speichert nur die Menge der deaktivierten Keys -- Default ist "alle aktiv",
 * damit ein frischer Stand ohne Migration korrekt ist.
 */
function readDisabledSet(): Set<string> {
  const raw = getSetting(DISABLED_KEY)
  if (!raw) return new Set()
  try {
    return new Set(JSON.parse(raw) as string[])
  } catch {
    return new Set()
  }
}

function writeDisabledSet(disabled: Set<string>): void {
  setSetting(DISABLED_KEY, JSON.stringify([...disabled]))
}

export function isBuiltInCommandEnabled(key: string): boolean {
  return !readDisabledSet().has(key)
}

export function setBuiltInCommandEnabled(key: string, enabled: boolean): void {
  const disabled = readDisabledSet()
  if (enabled) disabled.delete(key)
  else disabled.add(key)
  writeDisabledSet(disabled)
}

export function listDisabledBuiltInCommandKeys(): string[] {
  return [...readDisabledSet()]
}
