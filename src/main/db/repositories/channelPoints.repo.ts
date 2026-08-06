import { getDb } from '../connection'
import type {
  ChannelPointReward,
  ChannelPointRewardInput,
  RedemptionLogEntry,
  RedemptionStatus,
  RewardActionPayload
} from '@shared/types/channelPointReward'

interface RewardRow {
  id: number
  twitch_reward_id: string | null
  title: string
  cost: number
  prompt: string | null
  is_enabled: number
  auto_fulfill: number
  action_type: ChannelPointReward['actionType']
  action_payload: string | null
  background_color: string | null
  synced_at: number | null
  created_at: number
}

interface RedemptionRow {
  id: number
  reward_id: number | null
  reward_title?: string | null
  twitch_redemption_id: string
  user_login: string
  user_input: string | null
  status: RedemptionLogEntry['status']
  redeemed_at: number
  action_processed_at?: number | null
}

function toDomain(row: RewardRow): ChannelPointReward {
  return {
    id: row.id,
    twitchRewardId: row.twitch_reward_id,
    title: row.title,
    cost: row.cost,
    prompt: row.prompt,
    isEnabled: Boolean(row.is_enabled),
    autoFulfill: Boolean(row.auto_fulfill),
    actionType: row.action_type,
    actionPayload: row.action_payload
      ? (JSON.parse(row.action_payload) as RewardActionPayload)
      : null,
    backgroundColor: row.background_color,
    syncedAt: row.synced_at,
    createdAt: row.created_at
  }
}

function redemptionToDomain(row: RedemptionRow): RedemptionLogEntry {
  return {
    id: row.id,
    rewardId: row.reward_id,
    rewardTitle: row.reward_title ?? undefined,
    twitchRedemptionId: row.twitch_redemption_id,
    userLogin: row.user_login,
    userInput: row.user_input,
    status: row.status,
    redeemedAt: row.redeemed_at,
    actionProcessedAt: row.action_processed_at ?? null
  }
}

export function getRedemptionByTwitchId(twitchRedemptionId: string): RedemptionLogEntry | null {
  const row = getDb()
    .prepare<[string], RedemptionRow>(
      `SELECT redemption_log.*, channel_point_rewards.title AS reward_title
       FROM redemption_log
       LEFT JOIN channel_point_rewards ON channel_point_rewards.id = redemption_log.reward_id
       WHERE redemption_log.twitch_redemption_id = ?
       ORDER BY redemption_log.id DESC
       LIMIT 1`
    )
    .get(twitchRedemptionId)
  return row ? redemptionToDomain(row) : null
}

export function listRewards(): ChannelPointReward[] {
  return getDb()
    .prepare<[], RewardRow>('SELECT * FROM channel_point_rewards ORDER BY created_at DESC')
    .all()
    .map(toDomain)
}

export function createReward(input: ChannelPointRewardInput): ChannelPointReward {
  const result = getDb()
    .prepare(
      `INSERT INTO channel_point_rewards
         (title, cost, prompt, is_enabled, auto_fulfill, action_type, action_payload, background_color, created_at)
       VALUES (@title, @cost, @prompt, @isEnabled, @autoFulfill, @actionType, @actionPayload, @backgroundColor, @now)`
    )
    .run({
      title: input.title,
      cost: input.cost,
      prompt: input.prompt,
      isEnabled: input.isEnabled ? 1 : 0,
      autoFulfill: input.autoFulfill ? 1 : 0,
      actionType: input.actionType,
      actionPayload: input.actionPayload ? JSON.stringify(input.actionPayload) : null,
      backgroundColor: input.backgroundColor,
      now: Date.now()
    })

  return getRewardById(Number(result.lastInsertRowid))
}

export function updateReward(
  id: number,
  patch: Partial<ChannelPointRewardInput>
): ChannelPointReward {
  const current = getRewardById(id)
  const merged: ChannelPointRewardInput = { ...current, ...patch }

  getDb()
    .prepare(
      `UPDATE channel_point_rewards SET title = @title, cost = @cost, prompt = @prompt,
         is_enabled = @isEnabled, auto_fulfill = @autoFulfill, action_type = @actionType,
         action_payload = @actionPayload, background_color = @backgroundColor
       WHERE id = @id`
    )
    .run({
      id,
      title: merged.title,
      cost: merged.cost,
      prompt: merged.prompt,
      isEnabled: merged.isEnabled ? 1 : 0,
      autoFulfill: merged.autoFulfill ? 1 : 0,
      actionType: merged.actionType,
      actionPayload: merged.actionPayload ? JSON.stringify(merged.actionPayload) : null,
      backgroundColor: merged.backgroundColor
    })

  return getRewardById(id)
}

export function deleteReward(id: number): void {
  getDb().prepare('DELETE FROM channel_point_rewards WHERE id = ?').run(id)
}

export function setRewardTwitchSync(id: number, twitchRewardId: string, syncedAt: number): void {
  getDb()
    .prepare('UPDATE channel_point_rewards SET twitch_reward_id = ?, synced_at = ? WHERE id = ?')
    .run(twitchRewardId, syncedAt, id)
}

export function getRewardById(id: number): ChannelPointReward {
  const row = getDb()
    .prepare<[number], RewardRow>('SELECT * FROM channel_point_rewards WHERE id = ?')
    .get(id)
  if (!row) {
    throw new Error(`Reward mit id=${id} existiert nicht`)
  }
  return toDomain(row)
}

export function getRewardByTwitchId(twitchRewardId: string): ChannelPointReward | null {
  const row = getDb()
    .prepare<[string], RewardRow>('SELECT * FROM channel_point_rewards WHERE twitch_reward_id = ?')
    .get(twitchRewardId)
  return row ? toDomain(row) : null
}

export function getUniqueRewardByTitle(title: string): ChannelPointReward | null {
  const rows = getDb()
    .prepare<[string], RewardRow>('SELECT * FROM channel_point_rewards WHERE title = ? LIMIT 2')
    .all(title)
  return rows.length === 1 ? toDomain(rows[0]) : null
}

export function logRedemption(entry: Omit<RedemptionLogEntry, 'id'>): RedemptionLogEntry {
  const result = getDb()
    .prepare(
      `INSERT INTO redemption_log
         (reward_id, twitch_redemption_id, user_login, user_input, status, redeemed_at)
       VALUES (@rewardId, @twitchRedemptionId, @userLogin, @userInput, @status, @redeemedAt)`
    )
    .run({
      rewardId: entry.rewardId,
      twitchRedemptionId: entry.twitchRedemptionId,
      userLogin: entry.userLogin,
      userInput: entry.userInput,
      status: entry.status,
      redeemedAt: entry.redeemedAt
    })

  const row = getDb()
    .prepare<[number], RedemptionRow>(
      `SELECT redemption_log.*, channel_point_rewards.title AS reward_title
       FROM redemption_log
       LEFT JOIN channel_point_rewards ON channel_point_rewards.id = redemption_log.reward_id
       WHERE redemption_log.id = ?`
    )
    .get(Number(result.lastInsertRowid))!

  return redemptionToDomain(row)
}

export function updateRedemptionLogStatus(
  twitchRedemptionId: string,
  status: RedemptionStatus
): RedemptionLogEntry | null {
  const existing = getRedemptionByTwitchId(twitchRedemptionId)
  if (!existing) return null

  getDb()
    .prepare('UPDATE redemption_log SET status = ? WHERE twitch_redemption_id = ?')
    .run(status, twitchRedemptionId)

  return getRedemptionByTwitchId(twitchRedemptionId)
}

export function markRedemptionActionProcessed(
  twitchRedemptionId: string
): RedemptionLogEntry | null {
  const existing = getRedemptionByTwitchId(twitchRedemptionId)
  if (!existing || existing.actionProcessedAt) return existing

  getDb()
    .prepare(
      `UPDATE redemption_log
       SET action_processed_at = ?
       WHERE twitch_redemption_id = ? AND action_processed_at IS NULL`
    )
    .run(Date.now(), twitchRedemptionId)

  return getRedemptionByTwitchId(twitchRedemptionId)
}

export function listPendingActionRedemptions(
  limit = 50
): { redemption: RedemptionLogEntry; reward: ChannelPointReward }[] {
  interface PendingActionRow extends RedemptionRow, RewardRow {
    redemption_id: number
    reward_row_id: number
  }

  const rows = getDb()
    .prepare<[number], PendingActionRow>(
      `SELECT
         redemption_log.*,
         redemption_log.id AS redemption_id,
         channel_point_rewards.title AS reward_title,
         channel_point_rewards.id AS reward_row_id,
         channel_point_rewards.twitch_reward_id,
         channel_point_rewards.title,
         channel_point_rewards.cost,
         channel_point_rewards.prompt,
         channel_point_rewards.is_enabled,
         channel_point_rewards.auto_fulfill,
         channel_point_rewards.action_type,
         channel_point_rewards.action_payload,
         channel_point_rewards.background_color,
         channel_point_rewards.synced_at,
         channel_point_rewards.created_at
       FROM redemption_log
       JOIN channel_point_rewards ON channel_point_rewards.id = redemption_log.reward_id
       WHERE redemption_log.action_processed_at IS NULL
         AND channel_point_rewards.action_type != 'none'
       ORDER BY redemption_log.redeemed_at ASC
       LIMIT ?`
    )
    .all(limit)

  return rows.map((row) => ({
    redemption: redemptionToDomain({
      id: row.redemption_id,
      reward_id: row.reward_id,
      reward_title: row.reward_title,
      twitch_redemption_id: row.twitch_redemption_id,
      user_login: row.user_login,
      user_input: row.user_input,
      status: row.status,
      redeemed_at: row.redeemed_at,
      action_processed_at: row.action_processed_at
    }),
    reward: toDomain({ ...row, id: row.reward_row_id })
  }))
}

export function listRecentRedemptions(limit = 50): RedemptionLogEntry[] {
  return getDb()
    .prepare<[number], RedemptionRow>(
      `SELECT redemption_log.*, channel_point_rewards.title AS reward_title
       FROM redemption_log
       LEFT JOIN channel_point_rewards ON channel_point_rewards.id = redemption_log.reward_id
       ORDER BY redemption_log.redeemed_at DESC
       LIMIT ?`
    )
    .all(limit)
    .map(redemptionToDomain)
}
