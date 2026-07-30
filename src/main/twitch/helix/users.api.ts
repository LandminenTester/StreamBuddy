import { helixFetchJson } from './helixClient'

interface GetUsersResponse {
  data: { id: string; login: string; display_name: string }[]
}

/** Löst einen Twitch-Login-Namen (z.B. Zielkanal) zur numerischen User-ID auf. */
export async function getUserIdByLogin(login: string): Promise<string | null> {
  const response = await helixFetchJson<GetUsersResponse>(
    `/users?login=${encodeURIComponent(login)}`
  )
  return response.data[0]?.id ?? null
}
