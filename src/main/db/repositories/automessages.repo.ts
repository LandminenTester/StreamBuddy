import { getDb } from '../connection'
import type { Automessage, AutomessageInput } from '@shared/types/automessage'

interface AutomessageRow {
  id: number
  messages: string
  mode: Automessage['mode']
  interval_minutes: number | null
  message_count_threshold: number | null
  min_chat_lines_since_last: number
  enabled: number
  last_sent_at: number | null
  created_at: number
}

function toDomain(row: AutomessageRow): Automessage {
  return {
    id: row.id,
    messages: JSON.parse(row.messages) as string[],
    mode: row.mode,
    intervalMinutes: row.interval_minutes,
    messageCountThreshold: row.message_count_threshold,
    minChatLinesSinceLast: row.min_chat_lines_since_last,
    enabled: Boolean(row.enabled),
    lastSentAt: row.last_sent_at,
    createdAt: row.created_at
  }
}

export function listAutomessages(): Automessage[] {
  return getDb()
    .prepare<[], AutomessageRow>('SELECT * FROM automessages ORDER BY id ASC')
    .all()
    .map(toDomain)
}

export function createAutomessage(input: AutomessageInput): Automessage {
  const result = getDb()
    .prepare(
      `INSERT INTO automessages
         (messages, mode, interval_minutes, message_count_threshold, min_chat_lines_since_last, enabled, created_at)
       VALUES (@messages, @mode, @intervalMinutes, @messageCountThreshold, @minChatLinesSinceLast, @enabled, @now)`
    )
    .run({
      messages: JSON.stringify(input.messages),
      mode: input.mode,
      intervalMinutes: input.intervalMinutes,
      messageCountThreshold: input.messageCountThreshold,
      minChatLinesSinceLast: input.minChatLinesSinceLast,
      enabled: input.enabled ? 1 : 0,
      now: Date.now()
    })

  return getAutomessageById(Number(result.lastInsertRowid))
}

export function updateAutomessage(id: number, patch: Partial<AutomessageInput>): Automessage {
  const current = getAutomessageById(id)
  const merged: AutomessageInput = { ...current, ...patch }

  getDb()
    .prepare(
      `UPDATE automessages SET messages = @messages, mode = @mode, interval_minutes = @intervalMinutes,
         message_count_threshold = @messageCountThreshold, min_chat_lines_since_last = @minChatLinesSinceLast,
         enabled = @enabled
       WHERE id = @id`
    )
    .run({
      id,
      messages: JSON.stringify(merged.messages),
      mode: merged.mode,
      intervalMinutes: merged.intervalMinutes,
      messageCountThreshold: merged.messageCountThreshold,
      minChatLinesSinceLast: merged.minChatLinesSinceLast,
      enabled: merged.enabled ? 1 : 0
    })

  return getAutomessageById(id)
}

export function deleteAutomessage(id: number): void {
  getDb().prepare('DELETE FROM automessages WHERE id = ?').run(id)
}

export function touchAutomessageLastSent(id: number, timestamp: number): void {
  getDb().prepare('UPDATE automessages SET last_sent_at = ? WHERE id = ?').run(timestamp, id)
}

export function getAutomessageById(id: number): Automessage {
  const row = getDb()
    .prepare<[number], AutomessageRow>('SELECT * FROM automessages WHERE id = ?')
    .get(id)

  if (!row) {
    throw new Error(`Automessage mit id=${id} existiert nicht`)
  }

  return toDomain(row)
}
