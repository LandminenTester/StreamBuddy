import {
  getPollByTwitchId,
  markPollEnded,
  updatePollProgress
} from '../../../db/repositories/polls.repo'
import type { PollChoice, PollStatus } from '@shared/types/poll'
import { getMainWindow } from '../../../window'
import { IpcChannels } from '@shared/ipc/channels'
import { logger } from '../../../logger'

interface PollProgressEvent {
  id: string
  choices: { title: string; votes: number }[]
}

interface PollEndEvent extends PollProgressEvent {
  status: string
}

function toChoices(rawChoices: { title: string; votes: number }[]): PollChoice[] {
  return rawChoices.map((choice) => ({ title: choice.title, votes: choice.votes }))
}

function broadcastPollUpdate(twitchPollId: string): void {
  const poll = getPollByTwitchId(twitchPollId)
  if (poll) {
    getMainWindow()?.webContents.send(IpcChannels.polls.onUpdate, poll)
  }
}

export function handlePollProgressEvent(event: Record<string, unknown>): void {
  const payload = event as unknown as PollProgressEvent
  updatePollProgress(payload.id, toChoices(payload.choices))
  broadcastPollUpdate(payload.id)
}

const END_STATUS_MAP: Record<
  string,
  Extract<PollStatus, 'completed' | 'terminated' | 'archived'>
> = {
  completed: 'completed',
  terminated: 'terminated',
  archived: 'archived',
  moderated: 'terminated'
}

export function handlePollEndEvent(event: Record<string, unknown>): void {
  const payload = event as unknown as PollEndEvent
  const status = END_STATUS_MAP[payload.status.toLowerCase()] ?? 'terminated'

  if (!getPollByTwitchId(payload.id)) {
    logger.warn(`Poll-End-Event für unbekannte Poll-ID "${payload.id}" ignoriert`)
    return
  }

  markPollEnded(payload.id, status, toChoices(payload.choices))
  broadcastPollUpdate(payload.id)
}
