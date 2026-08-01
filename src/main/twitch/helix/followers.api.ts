import { helixFetchJson } from './helixClient'

export interface HelixFollower {
  user_id: string
  user_login: string
  user_name: string
  followed_at: string
}

interface FollowersResponse {
  data: HelixFollower[]
  pagination: { cursor?: string }
  total: number
}

/**
 * Lädt alle Follower des Kanals von der Helix-API (paginiert, max. 100 pro Seite).
 * Benötigt Scope: moderator:read:followers
 */
export async function fetchAllFollowers(broadcasterId: string): Promise<HelixFollower[]> {
  const results: HelixFollower[] = []
  let cursor: string | undefined

  do {
    const params = new URLSearchParams({
      broadcaster_id: broadcasterId,
      first: '100'
    })
    if (cursor) params.set('after', cursor)

    const response = await helixFetchJson<FollowersResponse>(`/channels/followers?${params}`)
    results.push(...response.data)
    cursor = response.pagination.cursor
  } while (cursor)

  return results
}
