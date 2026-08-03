import { IpcChannels } from '@shared/ipc/channels'
import type { ActivityEvent, ActivityEventInput } from '@shared/types/activity'
import { createActivityEvent } from '../db/repositories/activity.repo'
import { getMainWindow } from '../window'
import { createHash } from 'node:crypto'

function withDedupeId(input: ActivityEventInput): ActivityEventInput {
  if (input.twitchEventId) return input

  const source = JSON.stringify({
    eventType: input.eventType,
    actorLogin: input.actorLogin,
    targetLogin: input.targetLogin,
    summary: input.summary,
    payload: input.payload,
    occurredAt: input.occurredAt ?? null
  })
  const hash = createHash('sha256').update(source).digest('hex').slice(0, 24)
  return { ...input, twitchEventId: `local:${hash}` }
}

export function recordActivityEvent(input: ActivityEventInput): ActivityEvent | null {
  const event = createActivityEvent(withDedupeId(input))
  if (event) {
    getMainWindow()?.webContents.send(IpcChannels.activity.onEvent, event)
  }
  return event
}
