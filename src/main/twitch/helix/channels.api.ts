import { helixFetch, helixFetchJson } from './helixClient'

interface SearchCategoriesResponse {
  data: { id: string; name: string }[]
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
