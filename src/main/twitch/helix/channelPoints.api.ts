import { helixFetch, helixFetchJson } from './helixClient'

export interface TwitchCustomReward {
  id: string
  title: string
  cost: number
  prompt: string
  is_enabled: boolean
  background_color: string
  should_redemptions_skip_request_queue: boolean
}

interface CustomRewardsResponse {
  data: TwitchCustomReward[]
}

/**
 * Erstellt einen Custom Reward beim Broadcaster. Erfordert `channel:manage:redemptions`
 * -- Twitch verlangt hierfür ein Token des Broadcaster-Accounts selbst (kein Mod-Token),
 * siehe Hinweis in der Settings-UI (`channel_points`-Feature-Beschreibung).
 */
export async function createTwitchReward(
  broadcasterId: string,
  input: {
    title: string
    cost: number
    prompt: string | null
    backgroundColor: string | null
    autoFulfill?: boolean
  }
): Promise<TwitchCustomReward> {
  const response = await helixFetch(
    `/channel_points/custom_rewards?broadcaster_id=${broadcasterId}`,
    {
      method: 'POST',
      body: JSON.stringify({
        title: input.title,
        cost: input.cost,
        prompt: input.prompt ?? undefined,
        background_color: input.backgroundColor ?? undefined,
        should_redemptions_skip_request_queue: input.autoFulfill ?? false
      })
    }
  )
  if (!response.ok) {
    throw new Error(`Reward-Erstellung fehlgeschlagen: ${response.status} ${await response.text()}`)
  }
  const data = (await response.json()) as CustomRewardsResponse
  return data.data[0]
}

export async function updateTwitchReward(
  broadcasterId: string,
  twitchRewardId: string,
  input: {
    title?: string
    cost?: number
    prompt?: string | null
    isEnabled?: boolean
    backgroundColor?: string | null
    autoFulfill?: boolean
  }
): Promise<TwitchCustomReward> {
  const response = await helixFetch(
    `/channel_points/custom_rewards?broadcaster_id=${broadcasterId}&id=${twitchRewardId}`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        title: input.title,
        cost: input.cost,
        prompt: input.prompt ?? undefined,
        is_enabled: input.isEnabled,
        background_color: input.backgroundColor ?? undefined,
        should_redemptions_skip_request_queue: input.autoFulfill
      })
    }
  )
  if (!response.ok) {
    throw new Error(`Reward-Update fehlgeschlagen: ${response.status} ${await response.text()}`)
  }
  const data = (await response.json()) as CustomRewardsResponse
  return data.data[0]
}

export async function deleteTwitchReward(
  broadcasterId: string,
  twitchRewardId: string
): Promise<void> {
  const response = await helixFetch(
    `/channel_points/custom_rewards?broadcaster_id=${broadcasterId}&id=${twitchRewardId}`,
    { method: 'DELETE' }
  )
  if (!response.ok && response.status !== 404) {
    throw new Error(`Reward-Löschung fehlgeschlagen: ${response.status} ${await response.text()}`)
  }
}

export async function listTwitchRewards(broadcasterId: string): Promise<TwitchCustomReward[]> {
  const data = await helixFetchJson<CustomRewardsResponse>(
    `/channel_points/custom_rewards?broadcaster_id=${broadcasterId}&only_manageable_rewards=true`
  )
  return data.data
}

export async function updateRedemptionStatus(
  broadcasterId: string,
  rewardId: string,
  redemptionId: string,
  status: 'FULFILLED' | 'CANCELED'
): Promise<void> {
  const response = await helixFetch(
    `/channel_points/custom_reward_redemptions?broadcaster_id=${broadcasterId}&reward_id=${rewardId}&id=${redemptionId}`,
    { method: 'PATCH', body: JSON.stringify({ status }) }
  )
  if (!response.ok) {
    throw new Error(`Redemption-Update fehlgeschlagen: ${response.status} ${await response.text()}`)
  }
}
