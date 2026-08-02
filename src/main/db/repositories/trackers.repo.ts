import { getDb } from '../connection'
import type { CommandTracker, TrackerInput } from '@shared/types/tracker'

interface TrackerRow {
  id: number
  label: string
  value: number
  created_at: number
}

function toDomain(row: TrackerRow): CommandTracker {
  return {
    id: row.id,
    label: row.label,
    value: row.value,
    createdAt: row.created_at
  }
}

export function listTrackers(): CommandTracker[] {
  return getDb()
    .prepare<[], TrackerRow>('SELECT * FROM command_trackers ORDER BY created_at ASC')
    .all()
    .map(toDomain)
}

export function createTracker(input: TrackerInput): CommandTracker {
  const result = getDb()
    .prepare('INSERT INTO command_trackers (label, value) VALUES (@label, @value)')
    .run({ label: input.label.trim(), value: input.value ?? 0 })
  return getTrackerById(Number(result.lastInsertRowid))
}

export function updateTracker(id: number, patch: Partial<TrackerInput>): CommandTracker {
  const current = getTrackerById(id)
  const label = patch.label !== undefined ? patch.label.trim() : current.label
  const value = patch.value !== undefined ? patch.value : current.value
  getDb()
    .prepare('UPDATE command_trackers SET label = @label, value = @value WHERE id = @id')
    .run({ id, label, value })
  return getTrackerById(id)
}

export function deleteTracker(id: number): void {
  getDb().prepare('UPDATE commands SET tracker_id = NULL, tracker_action = NULL WHERE tracker_id = ?').run(id)
  getDb().prepare('DELETE FROM command_trackers WHERE id = ?').run(id)
}

export function adjustTracker(id: number, delta: number): CommandTracker {
  getDb()
    .prepare('UPDATE command_trackers SET value = value + @delta WHERE id = @id')
    .run({ id, delta })
  return getTrackerById(id)
}

export function getTrackerById(id: number): CommandTracker {
  const row = getDb()
    .prepare<[number], TrackerRow>('SELECT * FROM command_trackers WHERE id = ?')
    .get(id)
  if (!row) throw new Error(`Tracker id=${id} nicht gefunden`)
  return toDomain(row)
}
