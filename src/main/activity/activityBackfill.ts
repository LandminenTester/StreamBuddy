import { recordActivityEvent } from './activityService'
import { fetchRecentFollowers } from '../twitch/helix/followers.api'
import { logger } from '../logger'

export async function backfillRecentActivity(broadcasterId: string): Promise<void> {
  try {
    const followers = await fetchRecentFollowers(broadcasterId, 10)
    for (const follower of followers) {
      recordActivityEvent({
        eventType: 'follow',
        twitchEventId: `backfill:follow:${follower.user_id}:${follower.followed_at}`,
        actorLogin: follower.user_login,
        actorDisplayName: follower.user_name,
        summary: `${follower.user_name} folgt jetzt`,
        payload: { ...follower, source: 'backfill' },
        occurredAt: Date.parse(follower.followed_at)
      })
    }
  } catch (error) {
    logger.error('Activity-Backfill fehlgeschlagen', error)
  }
}
