import { getDb } from '../connection'
import type { Command, CommandInput, CommandTrackerAction } from '@shared/types/command'
import type { TrackerAction } from '@shared/types/tracker'

interface CommandRow {
  id: number
  trigger: string
  response: string
  aliases: string
  permission_level: Command['permissionLevel']
  cooldown_seconds: number
  delivery_mode: Command['deliveryMode']
  enabled: number
  use_count: number
  created_at: number
  updated_at: number
  tracker_id: number | null
  tracker_action: TrackerAction | null
  tracker_actions?: string | null
}

function parseTrackerActions(row: CommandRow): CommandTrackerAction[] {
  const fallback =
    row.tracker_id !== null && row.tracker_action
      ? [{ trackerId: row.tracker_id, action: row.tracker_action }]
      : []

  if (!row.tracker_actions) return fallback

  try {
    const parsed = JSON.parse(row.tracker_actions) as unknown
    if (!Array.isArray(parsed)) return fallback

    const actions = parsed
      .map((action): CommandTrackerAction | null => {
        if (!action || typeof action !== 'object') return null
        const candidate = action as Partial<CommandTrackerAction>
        if (
          typeof candidate.trackerId !== 'number' ||
          (candidate.action !== 'increment' && candidate.action !== 'decrement')
        ) {
          return null
        }
        return { trackerId: candidate.trackerId, action: candidate.action }
      })
      .filter((action): action is CommandTrackerAction => action !== null)

    return actions.length > 0 ? actions : fallback
  } catch {
    return fallback
  }
}

function toDomain(row: CommandRow): Command {
  const trackerActions = parseTrackerActions(row)
  const firstAction = trackerActions[0] ?? null

  return {
    id: row.id,
    trigger: row.trigger,
    response: row.response,
    aliases: JSON.parse(row.aliases) as string[],
    permissionLevel: row.permission_level,
    cooldownSeconds: row.cooldown_seconds,
    deliveryMode: row.delivery_mode,
    enabled: Boolean(row.enabled),
    useCount: row.use_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    trackerId: firstAction?.trackerId ?? row.tracker_id ?? null,
    trackerAction: firstAction?.action ?? row.tracker_action ?? null,
    trackerActions
  }
}

export function listCommands(): Command[] {
  const rows = getDb().prepare<[], CommandRow>('SELECT * FROM commands ORDER BY trigger ASC').all()
  return rows.map(toDomain)
}

export function createCommand(input: CommandInput): Command {
  const now = Date.now()
  const trackerActions =
    input.trackerActions ??
    (input.trackerId !== null && input.trackerAction
      ? [{ trackerId: input.trackerId, action: input.trackerAction }]
      : [])
  const result = getDb()
    .prepare(
      `INSERT INTO commands (trigger, response, aliases, permission_level, cooldown_seconds, delivery_mode, enabled, tracker_id, tracker_action, tracker_actions, created_at, updated_at)
       VALUES (@trigger, @response, @aliases, @permissionLevel, @cooldownSeconds, @deliveryMode, @enabled, @trackerId, @trackerAction, @trackerActions, @now, @now)`
    )
    .run({
      trigger: input.trigger,
      response: input.response,
      aliases: JSON.stringify(input.aliases),
      permissionLevel: input.permissionLevel,
      cooldownSeconds: input.cooldownSeconds,
      deliveryMode: input.deliveryMode,
      enabled: input.enabled ? 1 : 0,
      trackerId: trackerActions[0]?.trackerId ?? input.trackerId ?? null,
      trackerAction: trackerActions[0]?.action ?? input.trackerAction ?? null,
      trackerActions: JSON.stringify(trackerActions),
      now
    })

  return getCommandById(Number(result.lastInsertRowid))
}

export function updateCommand(id: number, patch: Partial<CommandInput>): Command {
  const current = getCommandById(id)
  const merged: CommandInput = { ...current, ...patch }
  const trackerActions =
    merged.trackerActions ??
    (merged.trackerId !== null && merged.trackerAction
      ? [{ trackerId: merged.trackerId, action: merged.trackerAction }]
      : [])

  getDb()
    .prepare(
      `UPDATE commands SET trigger = @trigger, response = @response, aliases = @aliases,
         permission_level = @permissionLevel, cooldown_seconds = @cooldownSeconds,
         delivery_mode = @deliveryMode, enabled = @enabled,
         tracker_id = @trackerId, tracker_action = @trackerAction, tracker_actions = @trackerActions,
         updated_at = @now
       WHERE id = @id`
    )
    .run({
      id,
      trigger: merged.trigger,
      response: merged.response,
      aliases: JSON.stringify(merged.aliases),
      permissionLevel: merged.permissionLevel,
      cooldownSeconds: merged.cooldownSeconds,
      deliveryMode: merged.deliveryMode,
      enabled: merged.enabled ? 1 : 0,
      trackerId: trackerActions[0]?.trackerId ?? merged.trackerId ?? null,
      trackerAction: trackerActions[0]?.action ?? merged.trackerAction ?? null,
      trackerActions: JSON.stringify(trackerActions),
      now: Date.now()
    })

  return getCommandById(id)
}

export function deleteCommand(id: number): void {
  getDb().prepare('DELETE FROM commands WHERE id = ?').run(id)
}

export function incrementCommandUseCount(id: number): void {
  getDb().prepare('UPDATE commands SET use_count = use_count + 1 WHERE id = ?').run(id)
}

export function getCommandById(id: number): Command {
  const row = getDb().prepare<[number], CommandRow>('SELECT * FROM commands WHERE id = ?').get(id)

  if (!row) {
    throw new Error(`Command mit id=${id} existiert nicht`)
  }

  return toDomain(row)
}
