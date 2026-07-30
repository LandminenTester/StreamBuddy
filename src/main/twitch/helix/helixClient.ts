import { forceRefresh, getValidAccessToken } from '../oauth/tokenRefresher'
import { requireTwitchClientId } from '../oauth/clientId'

const HELIX_BASE_URL = 'https://api.twitch.tv/helix'

/**
 * Fetch-Wrapper für die Twitch Helix-API: setzt Client-Id + Bearer-Token,
 * refresht proaktiv (getValidAccessToken) und einmalig reaktiv bei HTTP 401.
 */
export async function helixFetch(
  path: string,
  init: RequestInit = {},
  isRetry = false
): Promise<Response> {
  const clientId = requireTwitchClientId()
  const tokens = await getValidAccessToken()

  const response = await fetch(`${HELIX_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...init.headers,
      'Client-Id': clientId,
      Authorization: `Bearer ${tokens.accessToken}`,
      ...(init.body ? { 'Content-Type': 'application/json' } : {})
    }
  })

  if (response.status === 401 && !isRetry) {
    await forceRefresh()
    return helixFetch(path, init, true)
  }

  return response
}

export async function helixFetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await helixFetch(path, init)
  if (!response.ok) {
    throw new Error(
      `Helix-Request fehlgeschlagen (${path}): ${response.status} ${await response.text()}`
    )
  }
  return (await response.json()) as T
}
