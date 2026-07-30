import { getSetting, setSetting } from '../../db/repositories/appSettings.repo'

const SETTING_KEY = 'twitch_client_id'

export function getTwitchClientId(): string | null {
  return getSetting(SETTING_KEY)
}

export function setTwitchClientId(clientId: string): void {
  setSetting(SETTING_KEY, clientId.trim())
}

/** Wirft mit einer klaren Fehlermeldung, falls noch keine Client-ID hinterlegt ist. */
export function requireTwitchClientId(): string {
  const clientId = getTwitchClientId()
  if (!clientId) {
    throw new Error('Twitch-Client-ID fehlt -- in den Einstellungen eintragen')
  }
  return clientId
}
