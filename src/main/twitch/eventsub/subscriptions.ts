import { helixFetch } from '../helix/helixClient'
import { logger } from '../../logger'

export type EventSubType =
  | 'channel.channel_points_custom_reward_redemption.add'
  | 'channel.poll.progress'
  | 'channel.poll.end'
  | 'channel.follow'
  | 'channel.subscribe'
  | 'channel.subscription.gift'

interface SubscriptionSpec {
  type: EventSubType
  version: string
  condition: Record<string, string>
}

async function createSubscription(sessionId: string, spec: SubscriptionSpec): Promise<void> {
  const response = await helixFetch('/eventsub/subscriptions', {
    method: 'POST',
    body: JSON.stringify({
      type: spec.type,
      version: spec.version,
      condition: spec.condition,
      transport: { method: 'websocket', session_id: sessionId }
    })
  })

  if (!response.ok) {
    logger.error(
      `EventSub-Subscription "${spec.type}" fehlgeschlagen: ${response.status} ${await response.text()}`
    )
  }
}

/** Registriert die Channel-Points-Redemption-Subscription für eine neue EventSub-Session. */
export async function subscribeToChannelPointRedemptions(
  sessionId: string,
  broadcasterId: string
): Promise<void> {
  await createSubscription(sessionId, {
    type: 'channel.channel_points_custom_reward_redemption.add',
    version: '1',
    condition: { broadcaster_user_id: broadcasterId }
  })
}

export async function subscribeToPollEvents(
  sessionId: string,
  broadcasterId: string
): Promise<void> {
  await createSubscription(sessionId, {
    type: 'channel.poll.progress',
    version: '1',
    condition: { broadcaster_user_id: broadcasterId }
  })
  await createSubscription(sessionId, {
    type: 'channel.poll.end',
    version: '1',
    condition: { broadcaster_user_id: broadcasterId }
  })
}

export async function subscribeToFollowEvents(
  sessionId: string,
  broadcasterId: string,
  moderatorId: string
): Promise<void> {
  await createSubscription(sessionId, {
    type: 'channel.follow',
    version: '2',
    condition: { broadcaster_user_id: broadcasterId, moderator_user_id: moderatorId }
  })
}

export async function subscribeToSubscriptionEvents(
  sessionId: string,
  broadcasterId: string
): Promise<void> {
  await createSubscription(sessionId, {
    type: 'channel.subscribe',
    version: '1',
    condition: { broadcaster_user_id: broadcasterId }
  })
  await createSubscription(sessionId, {
    type: 'channel.subscription.gift',
    version: '1',
    condition: { broadcaster_user_id: broadcasterId }
  })
}
