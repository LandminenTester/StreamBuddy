import tmi from 'tmi.js'
import type { ChatConnectionStatus } from '@shared/types/chat'
import { readTokens } from '../oauth/tokenStore'
import { getValidAccessToken } from '../oauth/tokenRefresher'
import { getSetting } from '../../db/repositories/appSettings.repo'
import { handleChatMessage } from './commandRouter'
import {
  recordChatLineForAutomessages,
  startAutomessageScheduler,
  stopAutomessageScheduler
} from './automessageScheduler'
import { attachPresenceTracking, clearPresence } from './presenceTracker'
import { recordChatMessageForStats } from './messageCounter'
import { startViewTimeTicker, stopViewTimeTicker } from '../../loyalty/earnRules/onViewTimeTick'
import { startViewerCountPoller, stopViewerCountPoller } from '../../stats/viewerCountPoller'
import { getMainWindow } from '../../window'
import { IpcChannels } from '@shared/ipc/channels'
import { logger } from '../../logger'

let client: tmi.Client | null = null
let status: ChatConnectionStatus = { connected: false, channel: null, lastError: null }

function setStatus(patch: Partial<ChatConnectionStatus>): void {
  status = { ...status, ...patch }
  const window = getMainWindow()
  window?.webContents.send(IpcChannels.chat.onStatusChanged, status)
}

export function getChatStatus(): ChatConnectionStatus {
  return status
}

/** Sendet eine Chat-Nachricht über die aktive tmi.js-Verbindung (z.B. für Redemption-Aktionen). */
export async function sendChatMessage(message: string): Promise<void> {
  if (!client || !status.channel) {
    logger.warn('sendChatMessage übersprungen: Chat nicht verbunden')
    return
  }
  await client.say(status.channel, message)
}

/**
 * Baut die tmi.js-Verbindung zum konfigurierten Ziel-Channel auf, mit dem
 * gespeicherten Bot-Account-Token. Reconnect übernimmt tmi.js selbst
 * (options.connection.reconnect), inkl. exponentiellem Backoff.
 */
export async function connectChatClient(): Promise<void> {
  const tokens = readTokens()
  const targetChannel = getSetting('target_channel')

  if (!tokens || !targetChannel) {
    setStatus({
      connected: false,
      channel: null,
      lastError: !tokens ? 'Kein Bot-Account verbunden' : 'Kein Zielkanal konfiguriert'
    })
    return
  }

  if (client) {
    await disconnectChatClient()
  }

  const accessToken = (await getValidAccessToken()).accessToken

  client = new tmi.Client({
    connection: { reconnect: true, secure: true },
    identity: { username: tokens.twitchLogin, password: `oauth:${accessToken}` },
    channels: [targetChannel]
  })

  client.on('connected', () => {
    setStatus({ connected: true, channel: targetChannel, lastError: null })
    logger.info(`Chat verbunden mit Kanal #${targetChannel}`)
    if (client) {
      startAutomessageScheduler(client, targetChannel)
      attachPresenceTracking(client)
      startViewTimeTicker()
      startViewerCountPoller()
    }
  })

  client.on('disconnected', (reason) => {
    setStatus({ connected: false, lastError: reason })
    stopAutomessageScheduler()
    stopViewTimeTicker()
    stopViewerCountPoller()
    clearPresence()
  })

  client.on('message', (channel, tags, message, self) => {
    if (self || !client) return
    recordChatLineForAutomessages()
    recordChatMessageForStats((tags.username ?? '').toLowerCase())
    void handleChatMessage(client, channel, tags, message)
  })

  try {
    await client.connect()
  } catch (error) {
    setStatus({ connected: false, lastError: (error as Error).message })
    logger.error('tmi.js-Verbindung fehlgeschlagen', error)
  }
}

/** Startet die Automessage-Timer neu (z.B. nach Config-Änderung), ohne die Chat-Verbindung zu kappen. */
export function restartAutomessageSchedulerIfConnected(): void {
  if (client && status.connected && status.channel) {
    startAutomessageScheduler(client, status.channel)
  }
}

export async function disconnectChatClient(): Promise<void> {
  if (!client) return
  await client.disconnect()
  client = null
  stopAutomessageScheduler()
  stopViewTimeTicker()
  stopViewerCountPoller()
  clearPresence()
  setStatus({ connected: false, channel: null, lastError: null })
}
