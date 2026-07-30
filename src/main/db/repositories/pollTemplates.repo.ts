import { getDb } from '../connection'
import type { PollTemplate, PollTemplateInput } from '@shared/types/poll'

interface PollTemplateRow {
  id: number
  title: string
  choices: string
  duration_seconds: number
  channel_points_voting_enabled: number
  channel_points_per_vote: number
  created_at: number
}

function toDomain(row: PollTemplateRow): PollTemplate {
  return {
    id: row.id,
    title: row.title,
    choices: JSON.parse(row.choices) as string[],
    durationSeconds: row.duration_seconds,
    channelPointsVotingEnabled: Boolean(row.channel_points_voting_enabled),
    channelPointsPerVote: row.channel_points_per_vote,
    createdAt: row.created_at
  }
}

export function listPollTemplates(): PollTemplate[] {
  return getDb()
    .prepare<[], PollTemplateRow>('SELECT * FROM poll_templates ORDER BY created_at DESC')
    .all()
    .map(toDomain)
}

export function createPollTemplate(input: PollTemplateInput): PollTemplate {
  const result = getDb()
    .prepare(
      `INSERT INTO poll_templates
         (title, choices, duration_seconds, channel_points_voting_enabled, channel_points_per_vote, created_at)
       VALUES (@title, @choices, @durationSeconds, @channelPointsVotingEnabled, @channelPointsPerVote, @now)`
    )
    .run({
      title: input.title,
      choices: JSON.stringify(input.choices),
      durationSeconds: input.durationSeconds,
      channelPointsVotingEnabled: input.channelPointsVotingEnabled ? 1 : 0,
      channelPointsPerVote: input.channelPointsPerVote,
      now: Date.now()
    })

  return getPollTemplateById(Number(result.lastInsertRowid))
}

export function updatePollTemplate(id: number, input: PollTemplateInput): PollTemplate {
  getDb()
    .prepare(
      `UPDATE poll_templates
         SET title = @title, choices = @choices, duration_seconds = @durationSeconds,
             channel_points_voting_enabled = @channelPointsVotingEnabled,
             channel_points_per_vote = @channelPointsPerVote
       WHERE id = @id`
    )
    .run({
      id,
      title: input.title,
      choices: JSON.stringify(input.choices),
      durationSeconds: input.durationSeconds,
      channelPointsVotingEnabled: input.channelPointsVotingEnabled ? 1 : 0,
      channelPointsPerVote: input.channelPointsPerVote
    })

  return getPollTemplateById(id)
}

export function deletePollTemplate(id: number): void {
  getDb().prepare('DELETE FROM poll_templates WHERE id = ?').run(id)
}

export function getPollTemplateById(id: number): PollTemplate {
  const row = getDb()
    .prepare<[number], PollTemplateRow>('SELECT * FROM poll_templates WHERE id = ?')
    .get(id)
  if (!row) {
    throw new Error(`Poll-Template mit id=${id} existiert nicht`)
  }
  return toDomain(row)
}
