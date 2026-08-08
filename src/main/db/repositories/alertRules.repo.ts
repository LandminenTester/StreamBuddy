import { getDb } from '../connection'
import type {
  AlertAudioLayer,
  AlertMediaLayer,
  AlertRule,
  AlertRuleEventType,
  AlertRuleInput,
  AlertTextLayer
} from '@shared/types/alertRule'

interface AlertRuleRow {
  id: number
  event_type: AlertRuleEventType
  condition: string | null
  media: string
  audio: string
  text: string
  effect_id: number | null
  enabled: number
  created_at: number
  updated_at: number
}

function toDomain(row: AlertRuleRow): AlertRule {
  return {
    id: row.id,
    eventType: row.event_type,
    condition: row.condition,
    media: JSON.parse(row.media) as AlertMediaLayer,
    audio: JSON.parse(row.audio) as AlertAudioLayer,
    text: JSON.parse(row.text) as AlertTextLayer,
    effectId: row.effect_id,
    enabled: Boolean(row.enabled),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

export function listAlertRules(): AlertRule[] {
  return getDb()
    .prepare<[], AlertRuleRow>('SELECT * FROM alert_rules ORDER BY created_at ASC')
    .all()
    .map(toDomain)
}

export function getAlertRuleById(id: number): AlertRule {
  const row = getDb().prepare<[number], AlertRuleRow>('SELECT * FROM alert_rules WHERE id = ?').get(id)
  if (!row) throw new Error(`Alert-Regel mit id=${id} existiert nicht`)
  return toDomain(row)
}

export function createAlertRule(input: AlertRuleInput): AlertRule {
  const now = Date.now()
  const result = getDb()
    .prepare(
      `INSERT INTO alert_rules (event_type, condition, media, audio, text, effect_id, enabled, created_at, updated_at)
       VALUES (@eventType, @condition, @media, @audio, @text, @effectId, @enabled, @now, @now)`
    )
    .run({
      eventType: input.eventType,
      condition: input.condition,
      media: JSON.stringify(input.media),
      audio: JSON.stringify(input.audio),
      text: JSON.stringify(input.text),
      effectId: input.effectId,
      enabled: input.enabled ? 1 : 0,
      now
    })
  return getAlertRuleById(Number(result.lastInsertRowid))
}

export function updateAlertRule(id: number, patch: Partial<AlertRuleInput>): AlertRule {
  const current = getAlertRuleById(id)
  const merged: AlertRuleInput = { ...current, ...patch }
  getDb()
    .prepare(
      `UPDATE alert_rules SET event_type = @eventType, condition = @condition, media = @media,
         audio = @audio, text = @text, effect_id = @effectId, enabled = @enabled, updated_at = @now
       WHERE id = @id`
    )
    .run({
      id,
      eventType: merged.eventType,
      condition: merged.condition,
      media: JSON.stringify(merged.media),
      audio: JSON.stringify(merged.audio),
      text: JSON.stringify(merged.text),
      effectId: merged.effectId,
      enabled: merged.enabled ? 1 : 0,
      now: Date.now()
    })
  return getAlertRuleById(id)
}

export function deleteAlertRule(id: number): void {
  getDb().prepare('DELETE FROM alert_rules WHERE id = ?').run(id)
}

/** Prüft, ob mindestens eine aktive Regel existiert -- optional gefiltert nach Event-Typ. */
export function hasEnabledAlertRules(eventType?: AlertRuleEventType): boolean {
  const row = eventType
    ? getDb()
        .prepare<[string], { count: number }>(
          'SELECT COUNT(*) AS count FROM alert_rules WHERE enabled = 1 AND event_type = ?'
        )
        .get(eventType)
    : getDb()
        .prepare<[], { count: number }>('SELECT COUNT(*) AS count FROM alert_rules WHERE enabled = 1')
        .get()
  return (row?.count ?? 0) > 0
}
