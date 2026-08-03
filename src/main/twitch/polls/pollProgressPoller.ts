import type { Poll, PollChoice } from '@shared/types/poll'
import {
  getActivePoll,
  getPollByTwitchId,
  markPollEnded,
  updatePollProgress
} from '../../db/repositories/polls.repo'
import { getSetting } from '../../db/repositories/appSettings.repo'
import { getUserIdByLogin } from '../helix/users.api'
import { getTwitchPoll, type TwitchPoll } from '../helix/polls.api'
import { getMainWindow } from '../../window'
import { IpcChannels } from '@shared/ipc/channels'
import { logger } from '../../logger'

const POLL_INTERVAL_MS = 5_000

let pollTimer: NodeJS.Timeout | null = null
let broadcasterId: string | null = null
let inFlight = false

const END_STATUS_MAP: Record<
  string,
  Extract<Poll['status'], 'completed' | 'terminated' | 'archived'>
> = {
  COMPLETED: 'completed',
  TERMINATED: 'terminated',
  ARCHIVED: 'archived',
  MODERATED: 'terminated'
}

function toChoices(twitchPoll: TwitchPoll): PollChoice[] {
  return twitchPoll.choices.map((choice) => ({
    title: choice.title,
    votes: Math.max(0, Math.floor(choice.votes))
  }))
}

function highestVoteChoiceIndex(choices: PollChoice[]): number | null {
  if (choices.length === 0) return null
  let bestIndex = 0
  for (let i = 1; i < choices.length; i++) {
    if (choices[i].votes > choices[bestIndex].votes) bestIndex = i
  }
  return bestIndex
}

function broadcastPollUpdate(twitchPollId: string): void {
  const poll = getPollByTwitchId(twitchPollId)
  if (poll) {
    getMainWindow()?.webContents.send(IpcChannels.polls.onUpdate, poll)
  }
}

async function resolveBroadcasterId(): Promise<string | null> {
  if (broadcasterId) return broadcasterId

  const targetChannel = getSetting('target_channel')
  if (!targetChannel) return null

  broadcasterId = await getUserIdByLogin(targetChannel)
  return broadcasterId
}

function scheduleNext(): void {
  if (pollTimer) clearTimeout(pollTimer)
  pollTimer = setTimeout(() => void pollOnce(), POLL_INTERVAL_MS)
}

async function pollOnce(): Promise<void> {
  if (inFlight) return
  inFlight = true

  try {
    const activePoll = getActivePoll()
    if (!activePoll?.twitchPollId) {
      stopActivePollProgressPoller()
      return
    }

    const resolvedBroadcasterId = await resolveBroadcasterId()
    if (!resolvedBroadcasterId) {
      scheduleNext()
      return
    }

    const twitchPoll = await getTwitchPoll(resolvedBroadcasterId, activePoll.twitchPollId)
    if (!twitchPoll) {
      logger.warn(`Aktiver Poll "${activePoll.twitchPollId}" wurde bei Twitch nicht gefunden`)
      scheduleNext()
      return
    }

    const choices = toChoices(twitchPoll)
    const endedStatus = END_STATUS_MAP[twitchPoll.status]
    if (endedStatus) {
      const winnerChoiceIndex = activePoll.winnerChoiceIndex ?? highestVoteChoiceIndex(choices)
      markPollEnded(activePoll.twitchPollId, endedStatus, choices, winnerChoiceIndex)
      broadcastPollUpdate(activePoll.twitchPollId)
      stopActivePollProgressPoller()
      return
    }

    updatePollProgress(activePoll.twitchPollId, choices)
    broadcastPollUpdate(activePoll.twitchPollId)
    scheduleNext()
  } catch (error) {
    logger.error('Poll-Live-Abruf fehlgeschlagen', error)
    scheduleNext()
  } finally {
    inFlight = false
  }
}

export function startActivePollProgressPoller(): void {
  if (pollTimer) return
  void pollOnce()
}

export function stopActivePollProgressPoller(): void {
  if (pollTimer) clearTimeout(pollTimer)
  pollTimer = null
  broadcasterId = null
}
