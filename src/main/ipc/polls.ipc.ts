import { IpcChannels } from '@shared/ipc/channels'
import { handleTyped } from './handleTyped'
import type { Poll } from '@shared/types/poll'
import {
  createDraftPoll,
  deletePoll,
  forceResetPoll,
  getActivePoll,
  getPollById,
  listPolls,
  markPollActive,
  markPollEnded
} from '../db/repositories/polls.repo'
import { createTwitchPoll, endTwitchPoll } from '../twitch/helix/polls.api'
import { getUserIdByLogin } from '../twitch/helix/users.api'
import { getSetting } from '../db/repositories/appSettings.repo'
import {
  startActivePollProgressPoller,
  stopActivePollProgressPoller
} from '../twitch/polls/pollProgressPoller'

const END_STATUS_MAP: Record<
  string,
  Extract<Poll['status'], 'completed' | 'terminated' | 'archived'>
> = {
  completed: 'completed',
  terminated: 'terminated',
  archived: 'archived',
  moderated: 'terminated'
}

async function resolveBroadcasterId(): Promise<string> {
  const targetChannel = getSetting('target_channel')
  if (!targetChannel) {
    throw new Error('Kein Zielkanal konfiguriert')
  }
  const broadcasterId = await getUserIdByLogin(targetChannel)
  if (!broadcasterId) {
    throw new Error(`Konnte Twitch-User-ID für "${targetChannel}" nicht auflösen`)
  }
  return broadcasterId
}

export function registerPollsIpc(): void {
  startActivePollProgressPoller()

  handleTyped(IpcChannels.polls.list, () => listPolls())

  handleTyped(IpcChannels.polls.getActive, () => getActivePoll())

  handleTyped(IpcChannels.polls.create, async (input) => {
    const draft = createDraftPoll(input)

    try {
      const broadcasterId = await resolveBroadcasterId()
      const twitchPoll = await createTwitchPoll(broadcasterId, {
        title: input.title,
        choices: input.choices,
        durationSeconds: input.durationSeconds,
        channelPointsVotingEnabled: input.channelPointsVotingEnabled,
        channelPointsPerVote: input.channelPointsPerVote
      })
      const activePoll = markPollActive(draft.id, twitchPoll.id)
      startActivePollProgressPoller()
      return activePoll
    } catch (error) {
      deletePoll(draft.id)
      throw error
    }
  })

  handleTyped(IpcChannels.polls.end, async ({ id, winnerChoiceIndex }) => {
    const poll = getPollById(id)
    if (!poll.twitchPollId) {
      throw new Error('Poll wurde nie bei Twitch gestartet')
    }
    const broadcasterId = await resolveBroadcasterId()
    const twitchPoll = await endTwitchPoll(broadcasterId, poll.twitchPollId)

    // Lokalen Status direkt aus der Twitch-Antwort setzen, statt nur auf den
    // asynchronen channel.poll.end-EventSub-Webhook zu warten -- sonst bleibt
    // die Umfrage im Bot als "aktiv" stehen, obwohl sie auf Twitch bereits endete.
    const status = END_STATUS_MAP[twitchPoll.status.toLowerCase()] ?? 'terminated'
    const choices = twitchPoll.choices.map((choice) => ({
      title: choice.title,
      votes: choice.votes
    }))
    markPollEnded(poll.twitchPollId, status, choices, winnerChoiceIndex ?? null)
    stopActivePollProgressPoller()

    return getPollById(id)
  })

  handleTyped(IpcChannels.polls.reset, ({ id }) => {
    const poll = forceResetPoll(id)
    stopActivePollProgressPoller()
    return poll
  })
}
