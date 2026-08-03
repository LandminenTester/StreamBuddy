import type { ChatMessageBadge } from '@shared/types/chat'
import { helixFetchJson } from '../helix/helixClient'
import { getUserIdByLogin } from '../helix/users.api'
import { logger } from '../../logger'

interface BadgeVersion {
  id: string
  image_url_1x: string
  title: string
}

interface BadgeSet {
  set_id: string
  versions: BadgeVersion[]
}

interface BadgesResponse {
  data: BadgeSet[]
}

const badgeCache = new Map<string, ChatMessageBadge>()

function cacheBadges(response: BadgesResponse): void {
  for (const set of response.data) {
    for (const version of set.versions) {
      badgeCache.set(`${set.set_id}:${version.id}`, {
        id: set.set_id,
        version: version.id,
        title: version.title,
        imageUrl: version.image_url_1x
      })
    }
  }
}

export async function prepareChatBadges(channelLogin: string): Promise<void> {
  try {
    const broadcasterId = await getUserIdByLogin(channelLogin)
    const globalBadges = await helixFetchJson<BadgesResponse>('/chat/badges/global')
    cacheBadges(globalBadges)

    if (broadcasterId) {
      const channelBadges = await helixFetchJson<BadgesResponse>(
        `/chat/badges?broadcaster_id=${broadcasterId}`
      )
      cacheBadges(channelBadges)
    }
  } catch (error) {
    logger.error('Chat-Badges konnten nicht geladen werden', error)
  }
}

export function resolveChatBadges(badges: Record<string, string> | undefined): ChatMessageBadge[] {
  if (!badges) return []
  return Object.entries(badges).map(([id, version]) => {
    return (
      badgeCache.get(`${id}:${version}`) ?? {
        id,
        version,
        title: `${id} ${version}`,
        imageUrl: null
      }
    )
  })
}
