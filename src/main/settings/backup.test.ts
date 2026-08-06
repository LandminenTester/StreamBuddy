import { describe, expect, it, vi } from 'vitest'

vi.mock('../db/connection', () => ({ getDb: vi.fn() }))
vi.mock('../db/repositories/appSettings.repo', () => ({
  listSettings: vi.fn(),
  replaceSettings: vi.fn()
}))
vi.mock('../logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() }
}))

import { dedupeRows } from './backup'

describe('dedupeRows', () => {
  it('entfernt doppelte Primaerschluessel und behaelt die letzte Zeile', () => {
    // Genau der Fall aus alten Sicherungen: feature_scopes.shoutout doppelt exportiert.
    const rows = [
      { feature_key: 'core_chat', enabled: 1 },
      { feature_key: 'shoutout', enabled: 0 },
      { feature_key: 'shoutout', enabled: 1 }
    ]

    expect(dedupeRows(rows, [['feature_key']], 'feature_scopes')).toEqual([
      { feature_key: 'core_chat', enabled: 1 },
      { feature_key: 'shoutout', enabled: 1 }
    ])
  })

  it('beruecksichtigt UNIQUE-Indizes zusaetzlich zum Primaerschluessel', () => {
    const rows = [
      { id: 1, trigger: '!discord' },
      { id: 2, trigger: '!discord' }
    ]

    expect(dedupeRows(rows, [['id'], ['trigger']], 'commands')).toEqual([
      { id: 2, trigger: '!discord' }
    ])
  })

  it('vergleicht mehrspaltige Schluessel als Ganzes', () => {
    const rows = [
      { a: 1, b: 1 },
      { a: 1, b: 2 },
      { a: 1, b: 1 }
    ]

    expect(dedupeRows(rows, [['a', 'b']], 'beispiel')).toEqual([
      { a: 1, b: 2 },
      { a: 1, b: 1 }
    ])
  })

  it('laesst Zeilen unveraendert, wenn die Tabelle keine Eindeutigkeit erzwingt', () => {
    const rows = [{ value: 'x' }, { value: 'x' }]

    expect(dedupeRows(rows, [], 'ohne_constraint')).toEqual(rows)
  })

  it('ueberspringt Gruppen, deren Spalten in der Zeile fehlen', () => {
    // Sicherungen ohne AUTOINCREMENT-id duerfen nicht auf den fehlenden PK zusammenfallen.
    const rows = [{ trigger: '!a' }, { trigger: '!b' }]

    expect(dedupeRows(rows, [['id'], ['trigger']], 'commands')).toEqual(rows)
  })
})
