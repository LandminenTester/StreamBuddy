import tmi from 'tmi.js'
import type { ChatConnectionStatus } from '@shared/types/chat'
import { readTokens } from '../oauth/tokenStore'
import { getValidAccessToken } from '../oauth/tokenRefresher'
import { getSetting, setSetting } from '../../db/repositories/appSettings.repo'
import { handleChatMessage } from './commandRouter'
import {
  recordChatLineForAutomessages,
  startAutomessageScheduler,
  stopAutomessageScheduler
} from './automessageScheduler'
import { attachPresenceTracking, clearPresence, markPresent } from './presenceTracker'
import { recordChatMessageForStats } from './messageCounter'
import { startViewTimeTicker, stopViewTimeTicker } from '../../loyalty/earnRules/onViewTimeTick'
import {
  startRouletteScheduler,
  stopRouletteScheduler
} from '../../loyalty/games/rouletteScheduler'
import { startViewerCountPoller, stopViewerCountPoller } from '../../stats/viewerCountPoller'
import { startAdSchedulePoller, stopAdSchedulePoller } from '../ads/adSchedulePoller'
import { connectModChatClient, disconnectModChatClient } from './modTmiClient'
import { setBroadcasterClientRef } from './chatClientAccessor'
import { clearGreetingSession } from '../../loyalty/greetings'
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

/** Liest die Auto-Connect-Einstellung (Default: aktiviert, falls nie gesetzt). */
export function isAutoConnectEnabled(): boolean {
  return getSetting('chat_autoconnect') !== 'false'
}

export function setAutoConnectEnabled(enabled: boolean): void {
  setSetting('chat_autoconnect', enabled ? 'true' : 'false')
}

/**
 * Baut die tmi.js-Verbindung zum konfigurierten Ziel-Channel auf, mit dem
 * gespeicherten Bot-Account-Token. Reconnect übernimmt tmi.js selbst
 * (options.connection.reconnect), inkl. exponentiellem Backoff.
 *
 * `manual`: true für explizit vom Nutzer ausgelöste Verbindungsversuche (Klick auf
 * "Jetzt verbinden", Zielkanal speichern, OAuth-Erfolg) -- diese ignorieren die
 * Auto-Connect-Einstellung bewusst. Der automatische Aufruf beim App-Start respektiert sie.
 */
export async function connectChatClient(options: { manual?: boolean } = {}): Promise<void> {
  if (!options.manual && !isAutoConnectEnabled()) {
    setStatus({ connected: false, channel: null, lastError: 'Auto-Connect deaktiviert' })
    return
  }

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
      setBroadcasterClientRef(client)
      markPresent(targetChannel)
      startAutomessageScheduler(targetChannel)
      attachPresenceTracking(client)
      startViewTimeTicker()
      startViewerCountPoller()
      startRouletteScheduler(targetChannel)
      startAdSchedulePoller()
      void connectModChatClient(targetChannel)
    }
  })

  client.on('disconnected', (reason) => {
    setStatus({ connected: false, lastError: reason })
    setBroadcasterClientRef(null)
    stopAutomessageScheduler()
    stopViewTimeTicker()
    stopViewerCountPoller()
    stopRouletteScheduler()
    stopAdSchedulePoller()
    clearPresence()
    clearGreetingSession()
  })

  client.on('message', (channel, tags, message, self) => {
    if (self || !client) return
    markPresent(tags.username ?? '')
    recordChatLineForAutomessages()
    recordChatMessageForStats((tags.username ?? '').toLowerCase())
    getMainWindow()?.webContents.send(IpcChannels.chat.onMessage, {
      id: tags.id ?? `${Date.now()}-${Math.random()}`,
      username: tags.username ?? '',
      displayName: tags['display-name'] ?? tags.username ?? '',
      color: tags.color ?? null,
      message,
      timestamp: Date.now()
    })
    void handleChatMessage(channel, tags, message)
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
    startAutomessageScheduler(status.channel)
  }
}

export async function disconnectChatClient(): Promise<void> {
  if (!client) return
  await disconnectModChatClient()
  await client.disconnect()
  client = null
  setBroadcasterClientRef(null)
  stopAutomessageScheduler()
  stopViewTimeTicker()
  stopViewerCountPoller()
  stopRouletteScheduler()
  stopAdSchedulePoller()
  clearPresence()
  clearGreetingSession()
  setStatus({ connected: false, channel: null, lastError: null })
}
