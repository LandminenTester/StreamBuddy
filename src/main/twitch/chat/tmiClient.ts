import tmi from 'tmi.js'
import type { ChatConnectionStatus } from '@shared/types/chat'
import { readTokens } from '../oauth/tokenStore'
import { getValidAccessToken, forceRefresh } from '../oauth/tokenRefresher'
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
import { clearGreetingSession, startGreetingChecker } from '../../loyalty/greetings'
import { prepareChatBadges, resolveChatBadges } from './chatBadges'
import { prepareThirdPartyEmotes, applyThirdPartyEmotes } from './thirdPartyEmotes'
import { formatChatSegments } from './chatMessageFormatter'
import { getMainWindow } from '../../window'
import { IpcChannels } from '@shared/ipc/channels'
import { logger } from '../../logger'

let client: tmi.Client | null = null
let status: ChatConnectionStatus = { connected: false, channel: null, lastError: null }

/** tmi.js' connect() hat keinen eingebauten Timeout und kann bei Netzwerkproblemen ewig haengen. */
const CONNECT_TIMEOUT_MS = 15_000

function withTimeout<T>(promise: Promise<T>, ms: number, timeoutMessage: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(timeoutMessage)), ms)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        clearTimeout(timer)
        reject(error)
      }
    )
  })
}

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

  let accessToken: string
  try {
    accessToken = (await getValidAccessToken()).accessToken
  } catch (error) {
    setStatus({ connected: false, channel: null, lastError: (error as Error).message })
    logger.error('Token-Abruf vor Chat-Verbindung fehlgeschlagen', error)
    return
  }

  try {
    await attemptConnect(accessToken, tokens.twitchLogin, targetChannel)
    return
  } catch (error) {
    const message = (error as Error).message

    // "Login authentication failed" o.ae. deutet auf ein zwischenzeitlich ungueltig
    // gewordenes Access-Token hin (z.B. durch einen Refresh-Race mehrerer gleichzeitiger
    // Twitch-Aufrufe). Ein erzwungener Refresh + einmaliger Retry loest das automatisch,
    // ohne dass ein manueller Reauth durch den Nutzer noetig ist.
    if (!/auth/i.test(message)) {
      setStatus({ connected: false, lastError: message })
      logger.error('tmi.js-Verbindung fehlgeschlagen', error)
      return
    }

    logger.warn(`Chat-Verbindung mit Auth-Fehler fehlgeschlagen ("${message}"), erzwinge Token-Refresh und versuche erneut`)

    let refreshedToken: string
    try {
      refreshedToken = (await forceRefresh()).accessToken
    } catch (refreshError) {
      setStatus({ connected: false, lastError: (refreshError as Error).message })
      logger.error('Token-Refresh nach Auth-Fehler fehlgeschlagen', refreshError)
      return
    }

    try {
      await attemptConnect(refreshedToken, tokens.twitchLogin, targetChannel)
    } catch (retryError) {
      setStatus({ connected: false, lastError: (retryError as Error).message })
      logger.error('tmi.js-Verbindung nach Token-Refresh erneut fehlgeschlagen', retryError)
    }
  }
}

/**
 * Baut einen tmi.js-Client auf und verbindet ihn. Wirft bei einem Fehlschlag (inkl.
 * Timeout), nachdem der halb offene Client best-effort aufgeraeumt wurde, damit ein
 * Folgeversuch nicht auf demselben kaputten Client scheitert.
 */
async function attemptConnect(
  accessToken: string,
  twitchLogin: string,
  targetChannel: string
): Promise<void> {
  const newClient = new tmi.Client({
    connection: { reconnect: true, secure: true },
    identity: { username: twitchLogin, password: `oauth:${accessToken}` },
    channels: [targetChannel]
  })

  newClient.on('connected', () => {
    setStatus({ connected: true, channel: targetChannel, lastError: null })
    logger.info(`Chat verbunden mit Kanal #${targetChannel}`)
    setBroadcasterClientRef(newClient)
    markPresent(targetChannel)
    startAutomessageScheduler(targetChannel)
    attachPresenceTracking(newClient)
    startViewTimeTicker()
    startViewerCountPoller()
    startRouletteScheduler(targetChannel)
    startAdSchedulePoller()
    startGreetingChecker()
    void prepareChatBadges(targetChannel)
    void prepareThirdPartyEmotes(targetChannel)
    void connectModChatClient(targetChannel)
  })

  newClient.on('disconnected', (reason) => {
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

  newClient.on('message', (channel, tags, message, self) => {
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
      segments: applyThirdPartyEmotes(
        formatChatSegments(message, tags.emotes as Record<string, string[]> | undefined)
      ),
      badges: resolveChatBadges(tags.badges as Record<string, string> | undefined),
      timestamp: Date.now()
    })
    void handleChatMessage(channel, tags, message)
  })

  client = newClient

  try {
    await withTimeout(
      newClient.connect(),
      CONNECT_TIMEOUT_MS,
      'Zeitüberschreitung beim Verbindungsaufbau'
    )
  } catch (error) {
    // Bei einem Timeout oder Auth-Fehler haengt der Client evtl. noch mitten im
    // Handshake. Best-effort aufraeumen, damit ein Folgeversuch nicht auf demselben
    // kaputten Client scheitert (siehe disconnectChatClient fuer den gleichen Grund).
    try {
      await newClient.disconnect()
    } catch {
      // ignorieren -- der Socket war ohnehin nie sauber offen
    }
    if (client === newClient) {
      client = null
      setBroadcasterClientRef(null)
    }
    throw error
  }
}

export async function moderateChatUser(
  action: 'timeout' | 'ban' | 'unban',
  targetLogin: string,
  durationSeconds?: number
): Promise<void> {
  if (!client || !status.channel) {
    throw new Error('Chat ist nicht verbunden')
  }

  const target = targetLogin.trim().replace(/^@/, '')
  if (!target) throw new Error('Kein Nutzer angegeben')

  if (action === 'timeout') {
    await client.timeout(status.channel, target, durationSeconds ?? 600)
  } else if (action === 'ban') {
    await client.ban(status.channel, target)
  } else {
    await client.unban(status.channel, target)
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
  try {
    await client.disconnect()
  } catch (error) {
    // Socket kann bereits geschlossen/am Schliessen sein (z.B. nach einem Absturz
    // oder Netzwerkfehler, bevor tmi.js selbst das 'disconnected'-Event feuert).
    // Ein Fehler hier darf den Reconnect nicht blockieren.
    logger.warn('client.disconnect() fehlgeschlagen, Verbindung war bereits inaktiv', error)
  }
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
