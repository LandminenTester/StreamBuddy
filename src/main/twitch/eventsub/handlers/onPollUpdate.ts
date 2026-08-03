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

function isPollChoice(value: unknown): value is { title: string; votes: number } {
  if (!value || typeof value !== 'object') return false
  const choice = value as Record<string, unknown>
  return typeof choice.title === 'string' && typeof choice.votes === 'number'
}

function parseProgressEvent(event: Record<string, unknown>): PollProgressEvent | null {
  if (typeof event.id !== 'string' || !Array.isArray(event.choices)) return null
  if (!event.choices.every(isPollChoice)) return null
  return { id: event.id, choices: event.choices }
}

function parseEndEvent(event: Record<string, unknown>): PollEndEvent | null {
  const progress = parseProgressEvent(event)
  if (!progress || typeof event.status !== 'string') return null
  return { ...progress, status: event.status }
}

function toChoices(rawChoices: { title: string; votes: number }[]): PollChoice[] {
  return rawChoices.map((choice) => ({
    title: choice.title,
    votes: Math.max(0, Math.floor(choice.votes))
  }))
}

function broadcastPollUpdate(twitchPollId: string): void {
  const poll = getPollByTwitchId(twitchPollId)
  if (poll) {
    getMainWindow()?.webContents.send(IpcChannels.polls.onUpdate, poll)
  }
}

export function handlePollProgressEvent(event: Record<string, unknown>): void {
  const payload = parseProgressEvent(event)
  if (!payload) {
    logger.warn('Ungueltiges Poll-Progress-Event ignoriert')
    return
  }
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

function highestVoteChoiceIndex(choices: PollChoice[]): number | null {
  if (choices.length === 0) return 0
  let bestIndex = 0
  for (let i = 1; i < choices.length; i++) {
    if (choices[i].votes > choices[bestIndex].votes) bestIndex = i
  }
  return bestIndex
}

export function handlePollEndEvent(event: Record<string, unknown>): void {
  const payload = parseEndEvent(event)
  if (!payload) {
    logger.warn('Ungueltiges Poll-End-Event ignoriert')
    return
  }
  const status = END_STATUS_MAP[payload.status.toLowerCase()] ?? 'terminated'

  const existingPoll = getPollByTwitchId(payload.id)
  if (!existingPoll) {
    logger.warn(`Poll-End-Event für unbekannte Poll-ID "${payload.id}" ignoriert`)
    return
  }

  const choices = toChoices(payload.choices)
  // Falls der manuelle "Beenden"-Handler bereits einen Gewinner gesetzt hat (siehe
  // polls.ipc.ts), nicht überschreiben -- sonst würde dieser spätere Webhook die
  // manuelle Auswahl mit einem Auto-Ergebnis wieder verwerfen.
  const winnerChoiceIndex = existingPoll.winnerChoiceIndex ?? highestVoteChoiceIndex(choices)

  markPollEnded(payload.id, status, choices, winnerChoiceIndex)
  broadcastPollUpdate(payload.id)
}
