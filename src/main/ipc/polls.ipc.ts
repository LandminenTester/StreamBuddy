import { IpcChannels } from '@shared/ipc/channels'
import { handleTyped } from './handleTyped'
import {
  createDraftPoll,
  deletePoll,
  getActivePoll,
  getPollById,
  listPolls,
  markPollActive
} from '../db/repositories/polls.repo'
import { createTwitchPoll, endTwitchPoll } from '../twitch/helix/polls.api'
import { getUserIdByLogin } from '../twitch/helix/users.api'
import { getSetting } from '../db/repositories/appSettings.repo'

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
      return markPollActive(draft.id, twitchPoll.id)
    } catch (error) {
      deletePoll(draft.id)
      throw error
    }
  })

  handleTyped(IpcChannels.polls.end, async ({ id }) => {
    const poll = getPollById(id)
    if (!poll.twitchPollId) {
      throw new Error('Poll wurde nie bei Twitch gestartet')
    }
    const broadcasterId = await resolveBroadcasterId()
    await endTwitchPoll(broadcasterId, poll.twitchPollId)
    return getPollById(id)
  })
}
