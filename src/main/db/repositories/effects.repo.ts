import { getDb } from '../connection'
import type { Effect, EffectInput } from '@shared/types/alert'

interface EffectRow {
  id: number
  name: string
  video_path: string | null
  audio_path: string | null
  width: number
  height: number
  created_at: number
}

function toDomain(row: EffectRow): Effect {
  return {
    id: row.id,
    name: row.name,
    videoPath: row.video_path,
    audioPath: row.audio_path,
    width: row.width,
    height: row.height,
    createdAt: row.created_at
  }
}

export function listEffects(): Effect[] {
  const rows = getDb().prepare<[], EffectRow>('SELECT * FROM effects ORDER BY created_at ASC').all()
  return rows.map(toDomain)
}

export function getEffectById(id: number): Effect {
  const row = getDb().prepare<[number], EffectRow>('SELECT * FROM effects WHERE id = ?').get(id)
  if (!row) throw new Error(`Effekt mit id=${id} existiert nicht`)
  return toDomain(row)
}

export function createEffect(input: EffectInput): Effect {
  const result = getDb()
    .prepare(
      `INSERT INTO effects (name, video_path, audio_path, width, height, created_at)
       VALUES (@name, @videoPath, @audioPath, @width, @height, @now)`
    )
    .run({
      name: input.name,
      videoPath: input.videoPath,
      audioPath: input.audioPath,
      width: input.width,
      height: input.height,
      now: Date.now()
    })
  return getEffectById(Number(result.lastInsertRowid))
}

export function updateEffect(id: number, patch: Partial<EffectInput>): Effect {
  const current = getEffectById(id)
  const merged: EffectInput = { ...current, ...patch }
  getDb()
    .prepare(
      `UPDATE effects SET name = @name, video_path = @videoPath, audio_path = @audioPath,
         width = @width, height = @height WHERE id = @id`
    )
    .run({
      id,
      name: merged.name,
      videoPath: merged.videoPath,
      audioPath: merged.audioPath,
      width: merged.width,
      height: merged.height
    })
  return getEffectById(id)
}

export function deleteEffect(id: number): void {
  getDb().prepare('DELETE FROM effects WHERE id = ?').run(id)
}
