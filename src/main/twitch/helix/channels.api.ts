import { helixFetch, helixFetchJson } from './helixClient'

interface SearchCategoriesResponse {
  data: { id: string; name: string }[]
}

interface ChannelInformationResponse {
  data: { title: string; game_name: string }[]
}

export interface ChannelInformation {
  title: string | null
  gameName: string | null
}

/**
 * Liefert Titel + aktuelles Spiel unabhaengig vom Live-Status -- anders als die
 * Streams-API (nur waehrend live) bleiben diese Werte auch offline gueltig.
 * Braucht keinen eigenen Scope, jeder gueltige App-/User-Token reicht.
 */
export async function getChannelInformation(
  broadcasterId: string
): Promise<ChannelInformation> {
  const response = await helixFetchJson<ChannelInformationResponse>(
    `/channels?broadcaster_id=${encodeURIComponent(broadcasterId)}`
  )
  const channel = response.data[0]
  return {
    title: channel?.title || null,
    gameName: channel?.game_name || null
  }
}

/** Sucht Twitch-Kategorien (Spiele) per Namen, fuer die Aufloesung von Name -> game_id. */
export async function searchCategories(
  query: string
): Promise<{ id: string; name: string }[]> {
  if (!query.trim()) return []
  const response = await helixFetchJson<SearchCategoriesResponse>(
    `/search/categories?query=${encodeURIComponent(query)}&first=10`
  )
  return response.data
}

/** Aendert Titel und/oder Kategorie des Kanals (Twitch "Modify Channel Information"). */
export async function patchChannelInformation(
  broadcasterId: string,
  patch: { title?: string; gameId?: string }
): Promise<void> {
  const body: Record<string, string> = {}
  if (patch.title !== undefined) body.title = patch.title
  if (patch.gameId !== undefined) body.game_id = patch.gameId

  const response = await helixFetch(`/channels?broadcaster_id=${encodeURIComponent(broadcasterId)}`, {
    method: 'PATCH',
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    throw new Error(`Kanal-Update fehlgeschlagen: ${response.status} ${await response.text()}`)
  }
}
