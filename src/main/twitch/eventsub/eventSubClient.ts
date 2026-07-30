import { getUserIdByLogin } from '../helix/users.api'
import { getSetting } from '../../db/repositories/appSettings.repo'
import { listFeatureScopes } from '../../db/repositories/authTokens.repo'
import { readTokens } from '../oauth/tokenStore'
import {
  subscribeToChannelPointRedemptions,
  subscribeToPollEvents,
  subscribeToFollowEvents,
  subscribeToSubscriptionEvents
} from './subscriptions'
import { handleRedemptionAddEvent } from './handlers/onRedemption'
import { handlePollEndEvent, handlePollProgressEvent } from './handlers/onPollUpdate'
import { handleFollowEarnEvent } from '../../loyalty/earnRules/onFollow'
import { handleSubEarnEvent } from '../../loyalty/earnRules/onSub'
import { handleGiftSubEarnEvent } from '../../loyalty/earnRules/onGiftSub'
import {
  scheduleReconnect,
  resetReconnectBackoff,
  cancelScheduledReconnect
} from './reconnectManager'
import { logger } from '../../logger'

const DEFAULT_EVENTSUB_URL = 'wss://eventsub.wss.twitch.tv/ws'

interface EventSubMessage {
  metadata: { message_type: string }
  payload: {
    session?: { id: string; keepalive_timeout_seconds: number; reconnect_url?: string }
    subscription?: { type: string }
    event?: Record<string, unknown>
  }
}

let ws: WebSocket | null = null
let sessionId: string | null = null
let broadcasterId: string | null = null
let keepaliveTimer: NodeJS.Timeout | null = null
let intentionalClose = false
let oldWsForReconnect: WebSocket | null = null

function clearKeepaliveWatchdog(): void {
  if (keepaliveTimer) clearTimeout(keepaliveTimer)
  keepaliveTimer = null
}

function armKeepaliveWatchdog(timeoutSeconds: number): void {
  clearKeepaliveWatchdog()
  keepaliveTimer = setTimeout(
    () => {
      logger.warn('EventSub-Keepalive-Timeout überschritten, verbinde neu')
      reconnect()
    },
    (timeoutSeconds + 5) * 1000
  )
}

async function onSessionWelcome(session: {
  id: string
  keepalive_timeout_seconds: number
}): Promise<void> {
  sessionId = session.id
  armKeepaliveWatchdog(session.keepalive_timeout_seconds)
  resetReconnectBackoff()

  if (oldWsForReconnect) {
    oldWsForReconnect.close()
    oldWsForReconnect = null
    return // Subscriptions übertragen sich bei session_reconnect automatisch (Twitch-Doku)
  }

  if (!broadcasterId) return

  if (isChannelPointsFeatureEnabled()) {
    await subscribeToChannelPointRedemptions(sessionId, broadcasterId)
  }
  if (isPollsFeatureEnabled()) {
    await subscribeToPollEvents(sessionId, broadcasterId)
  }
  if (isLoyaltyFollowSubFeatureEnabled()) {
    const moderatorId = readTokens()?.twitchUserId
    if (moderatorId) {
      await subscribeToFollowEvents(sessionId, broadcasterId, moderatorId)
      await subscribeToSubscriptionEvents(sessionId, broadcasterId)
    }
  }
  logger.info('EventSub verbunden und Subscriptions registriert')
}

function handleMessage(raw: string): void {
  const message = JSON.parse(raw) as EventSubMessage
  const type = message.metadata.message_type

  if (type === 'session_keepalive') {
    armKeepaliveWatchdog(30)
    return
  }

  if (type === 'session_welcome' && message.payload.session) {
    void onSessionWelcome(message.payload.session)
    return
  }

  if (type === 'session_reconnect' && message.payload.session?.reconnect_url) {
    oldWsForReconnect = ws
    connect(message.payload.session.reconnect_url)
    return
  }

  if (type === 'notification' && message.payload.subscription && message.payload.event) {
    armKeepaliveWatchdog(30)
    const eventType = message.payload.subscription.type
    const eventData = message.payload.event

    if (eventType === 'channel.channel_points_custom_reward_redemption.add' && broadcasterId) {
      // Fire-and-forget, aber ohne try/catch würde ein Fehler hier (z.B. beim
      // Chat-Nachricht-Senden) als unhandled promise rejection verschwinden --
      // unsichtbar für den Nutzer, kein Log, kein Hinweis auf den Fehlschlag.
      handleRedemptionAddEvent(eventData, broadcasterId).catch((error) => {
        logger.error('Verarbeitung der Channel-Points-Redemption fehlgeschlagen', error)
      })
    } else if (eventType === 'channel.poll.progress') {
      handlePollProgressEvent(eventData)
    } else if (eventType === 'channel.poll.end') {
      handlePollEndEvent(eventData)
    } else if (eventType === 'channel.follow') {
      handleFollowEarnEvent(eventData)
    } else if (eventType === 'channel.subscribe') {
      handleSubEarnEvent(eventData)
    } else if (eventType === 'channel.subscription.gift') {
      handleGiftSubEarnEvent(eventData)
    }
  }
}

function connect(url: string): void {
  ws = new WebSocket(url)
  ws.addEventListener('message', (event) => handleMessage(event.data as string))
  ws.addEventListener('close', () => {
    clearKeepaliveWatchdog()
    if (!intentionalClose) {
      scheduleReconnect(reconnect)
    }
  })
  ws.addEventListener('error', (error) => {
    logger.error('EventSub-WebSocket-Fehler', error)
  })
}

function reconnect(): void {
  if (intentionalClose) return
  connect(DEFAULT_EVENTSUB_URL)
}

/** Baut die EventSub-Verbindung auf und abonniert Channel-Points-Redemptions für den Zielkanal. */
export async function startEventSub(): Promise<void> {
  const targetChannel = getSetting('target_channel')
  if (!targetChannel) {
    logger.warn('EventSub-Start übersprungen: kein Zielkanal konfiguriert')
    return
  }

  const resolvedId = await getUserIdByLogin(targetChannel)
  if (!resolvedId) {
    logger.error(`Konnte Twitch-User-ID für Zielkanal "${targetChannel}" nicht auflösen`)
    return
  }
  broadcasterId = resolvedId

  intentionalClose = false
  connect(DEFAULT_EVENTSUB_URL)
}

export function stopEventSub(): void {
  intentionalClose = true
  cancelScheduledReconnect()
  clearKeepaliveWatchdog()
  ws?.close()
  ws = null
  sessionId = null
  broadcasterId = null
}

function isChannelPointsFeatureEnabled(): boolean {
  return listFeatureScopes().some((f) => f.featureKey === 'channel_points' && f.enabled)
}

function isPollsFeatureEnabled(): boolean {
  return listFeatureScopes().some((f) => f.featureKey === 'polls' && f.enabled)
}

function isLoyaltyFollowSubFeatureEnabled(): boolean {
  return listFeatureScopes().some((f) => f.featureKey === 'loyalty_follow_sub' && f.enabled)
}

/**
 * Startet oder stoppt EventSub je nach aktuellem Zustand (Bot verbunden, Zielkanal gesetzt,
 * mind. ein EventSub-abhängiges Feature aktiviert). Zentrale Aufrufstelle für alle Trigger
 * (App-Start, OAuth-Erfolg, Feature-Toggle, Zielkanal-Änderung).
 */
export async function syncEventSubConnection(): Promise<void> {
  const shouldRun =
    readTokens() !== null &&
    getSetting('target_channel') !== null &&
    (isChannelPointsFeatureEnabled() ||
      isPollsFeatureEnabled() ||
      isLoyaltyFollowSubFeatureEnabled())

  if (shouldRun) {
    stopEventSub()
    await startEventSub()
  } else {
    stopEventSub()
  }
}
