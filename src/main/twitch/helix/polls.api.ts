import { helixFetch } from './helixClient'

export interface TwitchPollChoice {
  id: string
  title: string
  votes: number
  channel_points_votes: number
}

export interface TwitchPoll {
  id: string
  title: string
  choices: TwitchPollChoice[]
  channel_points_voting_enabled: boolean
  channel_points_per_vote: number
  status: 'ACTIVE' | 'COMPLETED' | 'TERMINATED' | 'ARCHIVED' | 'MODERATED' | 'INVALID'
  duration: number
}

interface PollsResponse {
  data: TwitchPoll[]
}

/** Erstellt und startet eine Twitch-Umfrage. Erfordert `channel:manage:polls`. */
export async function createTwitchPoll(
  broadcasterId: string,
  input: {
    title: string
    choices: string[]
    durationSeconds: number
    channelPointsVotingEnabled: boolean
    channelPointsPerVote: number
  }
): Promise<TwitchPoll> {
  const response = await helixFetch('/polls', {
    method: 'POST',
    body: JSON.stringify({
      broadcaster_id: broadcasterId,
      title: input.title,
      choices: input.choices.map((title) => ({ title })),
      duration: input.durationSeconds,
      channel_points_voting_enabled: input.channelPointsVotingEnabled,
      channel_points_per_vote: input.channelPointsVotingEnabled ? input.channelPointsPerVote : 0
    })
  })

  if (!response.ok) {
    throw new Error(`Poll-Erstellung fehlgeschlagen: ${response.status} ${await response.text()}`)
  }
  const data = (await response.json()) as PollsResponse
  return data.data[0]
}

/** Holt eine Twitch-Umfrage samt aktuellem Stimmenstand. */
export async function getTwitchPoll(
  broadcasterId: string,
  twitchPollId: string
): Promise<TwitchPoll | null> {
  const response = await helixFetch(
    `/polls?broadcaster_id=${broadcasterId}&id=${encodeURIComponent(twitchPollId)}`
  )

  if (response.status === 404) return null

  if (!response.ok) {
    throw new Error(`Poll-Abruf fehlgeschlagen: ${response.status} ${await response.text()}`)
  }
  const data = (await response.json()) as PollsResponse
  return data.data[0] ?? null
}

/** Beendet eine laufende Umfrage vorzeitig. */
export async function endTwitchPoll(
  broadcasterId: string,
  twitchPollId: string,
  status: 'TERMINATED' | 'ARCHIVED' = 'TERMINATED'
): Promise<TwitchPoll> {
  const response = await helixFetch('/polls', {
    method: 'PATCH',
    body: JSON.stringify({ broadcaster_id: broadcasterId, id: twitchPollId, status })
  })

  if (!response.ok) {
    throw new Error(`Poll-Beenden fehlgeschlagen: ${response.status} ${await response.text()}`)
  }
  const data = (await response.json()) as PollsResponse
  return data.data[0]
}
