import { getDb } from '../connection'
import type { Poll, PollChoice, PollCreateInput } from '@shared/types/poll'

interface PollRow {
  id: number
  twitch_poll_id: string | null
  title: string
  choices: string
  status: Poll['status']
  duration_seconds: number
  channel_points_voting_enabled: number
  channel_points_per_vote: number
  started_at: number | null
  ended_at: number | null
  created_at: number
}

function toDomain(row: PollRow): Poll {
  return {
    id: row.id,
    twitchPollId: row.twitch_poll_id,
    title: row.title,
    choices: JSON.parse(row.choices) as PollChoice[],
    status: row.status,
    durationSeconds: row.duration_seconds,
    channelPointsVotingEnabled: Boolean(row.channel_points_voting_enabled),
    channelPointsPerVote: row.channel_points_per_vote,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    createdAt: row.created_at
  }
}

export function listPolls(): Poll[] {
  return getDb()
    .prepare<[], PollRow>('SELECT * FROM polls ORDER BY created_at DESC')
    .all()
    .map(toDomain)
}

export function getActivePoll(): Poll | null {
  const row = getDb()
    .prepare<[], PollRow>("SELECT * FROM polls WHERE status = 'active' ORDER BY id DESC LIMIT 1")
    .get()
  return row ? toDomain(row) : null
}

export function deletePoll(id: number): void {
  getDb().prepare('DELETE FROM polls WHERE id = ?').run(id)
}

export function createDraftPoll(input: PollCreateInput): Poll {
  const choices: PollChoice[] = input.choices.map((title) => ({ title, votes: 0 }))

  const result = getDb()
    .prepare(
      `INSERT INTO polls
         (title, choices, status, duration_seconds, channel_points_voting_enabled, channel_points_per_vote, created_at)
       VALUES (@title, @choices, 'draft', @durationSeconds, @channelPointsVotingEnabled, @channelPointsPerVote, @now)`
    )
    .run({
      title: input.title,
      choices: JSON.stringify(choices),
      durationSeconds: input.durationSeconds,
      channelPointsVotingEnabled: input.channelPointsVotingEnabled ? 1 : 0,
      channelPointsPerVote: input.channelPointsPerVote,
      now: Date.now()
    })

  return getPollById(Number(result.lastInsertRowid))
}

export function markPollActive(id: number, twitchPollId: string): Poll {
  getDb()
    .prepare("UPDATE polls SET status = 'active', twitch_poll_id = ?, started_at = ? WHERE id = ?")
    .run(twitchPollId, Date.now(), id)
  return getPollById(id)
}

export function updatePollProgress(twitchPollId: string, choices: PollChoice[]): void {
  getDb()
    .prepare('UPDATE polls SET choices = ? WHERE twitch_poll_id = ?')
    .run(JSON.stringify(choices), twitchPollId)
}

export function markPollEnded(
  twitchPollId: string,
  status: Extract<Poll['status'], 'completed' | 'terminated' | 'archived'>,
  choices: PollChoice[]
): void {
  getDb()
    .prepare('UPDATE polls SET status = ?, choices = ?, ended_at = ? WHERE twitch_poll_id = ?')
    .run(status, JSON.stringify(choices), Date.now(), twitchPollId)
}

export function getPollById(id: number): Poll {
  const row = getDb().prepare<[number], PollRow>('SELECT * FROM polls WHERE id = ?').get(id)
  if (!row) {
    throw new Error(`Poll mit id=${id} existiert nicht`)
  }
  return toDomain(row)
}

export function getPollByTwitchId(twitchPollId: string): Poll | null {
  const row = getDb()
    .prepare<[string], PollRow>('SELECT * FROM polls WHERE twitch_poll_id = ?')
    .get(twitchPollId)
  return row ? toDomain(row) : null
}
