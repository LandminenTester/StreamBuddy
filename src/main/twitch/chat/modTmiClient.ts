import tmi from 'tmi.js'
import { readModTokens } from '../oauth/modTokenStore'
import { getValidModAccessToken } from '../oauth/modTokenRefresher'
import { setModClientRef } from './chatClientAccessor'
import { logger } from '../../logger'

let client: tmi.Client | null = null
let connected = false

/**
 * Verbindet den optionalen Mod-Account mit dem Ziel-Channel.
 * Schlägt still fehl, wenn kein Mod-Account gespeichert ist -- das ist
 * der erlaubte Normalfall ohne Mod-Account.
 */
export async function connectModChatClient(channel: string): Promise<void> {
  const tokens = readModTokens()
  if (!tokens) return

  if (client) {
    await disconnectModChatClient()
  }

  let accessToken: string
  try {
    const refreshed = await getValidModAccessToken()
    if (!refreshed) return
    accessToken = refreshed.accessToken
  } catch (error) {
    logger.error('Mod-Account Token-Refresh fehlgeschlagen, Mod-Client wird nicht verbunden', error)
    return
  }

  client = new tmi.Client({
    connection: { reconnect: true, secure: true },
    identity: { username: tokens.twitchLogin, password: `oauth:${accessToken}` },
    channels: [channel]
  })

  client.on('connected', () => {
    connected = true
    setModClientRef(client)
    logger.info(`Mod-Chat-Client verbunden mit Kanal #${channel} als ${tokens.twitchLogin}`)
  })

  client.on('disconnected', (reason) => {
    connected = false
    setModClientRef(null)
    logger.info(`Mod-Chat-Client getrennt: ${reason}`)
  })

  try {
    await client.connect()
  } catch (error) {
    connected = false
    setModClientRef(null)
    client = null
    logger.error('Mod-Chat-Verbindung fehlgeschlagen', error)
  }
}

export async function disconnectModChatClient(): Promise<void> {
  if (!client) return
  try {
    await client.disconnect()
  } catch {
    // Fehler beim Trennen ignorieren
  }
  client = null
  connected = false
  setModClientRef(null)
}

export function isModClientConnected(): boolean {
  return connected
}
