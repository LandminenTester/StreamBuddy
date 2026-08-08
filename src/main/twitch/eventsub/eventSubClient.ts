import WebSocket from 'ws'
import { getUserIdByLogin } from '../helix/users.api'
import { listTwitchRewards } from '../helix/channelPoints.api'
import { getSetting } from '../../db/repositories/appSettings.repo'
import { listFeatureScopes } from '../../db/repositories/authTokens.repo'
import { listRewards, setRewardTwitchSync } from '../../db/repositories/channelPoints.repo'
import { readTokens } from '../oauth/tokenStore'
import {
  subscribeToChannelPointRedemptions,
  subscribeToPollEvents,
  subscribeToFollowEvents,
  subscribeToSubscriptionEvents,
  subscribeToActivityFeedEvents,
  subscribeToRaidEvents
} from './subscriptions'
import { handleRaidShoutout, getAutoShoutoutEnabled } from '../shoutouts/autoShoutout'
import {
  handleAutomaticRedemptionAddEvent,
  handleRedemptionAddEvent,
  handleRedemptionUpdateEvent
} from './handlers/onRedemption'
import { handlePollEndEvent, handlePollProgressEvent } from './handlers/onPollUpdate'
import { handleFollowEarnEvent } from '../../loyalty/earnRules/onFollow'
import { handleSubEarnEvent } from '../../loyalty/earnRules/onSub'
import { handleGiftSubEarnEvent } from '../../loyalty/earnRules/onGiftSub'
import {
  handleCheerActivityEvent,
  handleFollowActivityEvent,
  handleGiftSubActivityEvent,
  handleRaidActivityEvent,
  handleResubActivityEvent,
  handleSubActivityEvent
} from './handlers/onActivityEvent'
import { backfillRecentActivity } from '../../activity/activityBackfill'
import {
  scheduleReconnect,
  resetReconnectBackoff,
  cancelScheduledReconnect
} from './reconnectManager'
import {
  handleFollowAlert,
  handleGiftSubAlert,
  handleRaidAlert,
  handleSubAlert
} from '../../alerts/alertManagerHandlers'
import { hasEnabledAlertRules } from '../../db/repositories/alertRules.repo'
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

async function syncMissingChannelPointRewardIds(targetBroadcasterId: string): Promise<void> {
  const unsyncedRewards = listRewards().filter((reward) => !reward.twitchRewardId)
  if (unsyncedRewards.length === 0) return

  try {
    const twitchRewards = await listTwitchRewards(targetBroadcasterId)
    const rewardsByTitle = new Map<string, typeof twitchRewards>()

    for (const twitchReward of twitchRewards) {
      rewardsByTitle.set(twitchReward.title, [
        ...(rewardsByTitle.get(twitchReward.title) ?? []),
        twitchReward
      ])
    }

    for (const localReward of unsyncedRewards) {
      const matches = rewardsByTitle.get(localReward.title) ?? []
      if (matches.length !== 1) continue

      setRewardTwitchSync(localReward.id, matches[0].id, Date.now())
      logger.info(
        `Lokaler Reward "${localReward.title}" mit Twitch-Reward-ID "${matches[0].id}" synchronisiert`
      )
    }
  } catch (error) {
    logger.error(
      'Konnte lokale Channel-Point-Rewards nicht mit Twitch synchronisieren. Pruefe, ob der verbundene Broadcaster-Account zum Zielkanal passt und channel:read:redemptions gewaehlt wurde.',
      error
    )
  }
}

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

  const tokens = readTokens()
  const activityFeedEnabled = isActivityFeedFeatureEnabled()
  const channelPointsEnabled = isChannelPointsFeatureEnabled()
  const loyaltyFollowSubEnabled = isLoyaltyFollowSubFeatureEnabled()
  const moderatorId = tokens?.twitchUserId

  if (tokens && tokens.twitchUserId !== broadcasterId) {
    logger.warn(
      `EventSub-Zielkanal (${broadcasterId}) unterscheidet sich vom verbundenen Broadcaster-Token (${tokens.twitchUserId}). Channel-Point- und Sub-Events koennen von Twitch abgelehnt werden.`
    )
  }

  if (channelPointsEnabled) {
    await syncMissingChannelPointRewardIds(broadcasterId)
  }

  if (channelPointsEnabled || activityFeedEnabled) {
    const channelPointSubscriptionsOk = await subscribeToChannelPointRedemptions(
      sessionId,
      broadcasterId,
      activityFeedEnabled
    )
    if (!channelPointSubscriptionsOk) {
      logger.error(
        'Mindestens eine Channel-Point-EventSub-Subscription wurde von Twitch abgelehnt. Redemptions koennen dadurch keine Commands oder Loyalty-Aktionen ausloesen.'
      )
    }
  }
  if (isPollsFeatureEnabled()) {
    await subscribeToPollEvents(sessionId, broadcasterId)
  }
  // Alert-Manager-Regeln brauchen die gleichen Events wie loyalty_follow_sub -- ohne diese
  // Erweiterung würden Follow-/Sub-/Gift-Sub-Alerts lautlos nie feuern, wenn der Nutzer nur
  // den Alert Manager nutzt und sonst kein anderes EventSub-abhängiges Feature aktiviert hat.
  const needsFollowSubEvents =
    loyaltyFollowSubEnabled || hasEnabledAlertRules('follow') || hasEnabledAlertRules('sub')
  if (needsFollowSubEvents) {
    if (moderatorId) {
      await subscribeToFollowEvents(sessionId, broadcasterId, moderatorId)
    }
    await subscribeToSubscriptionEvents(sessionId, broadcasterId)
  }
  if (activityFeedEnabled) {
    void backfillRecentActivity(broadcasterId)
    // !needsFollowSubEvents (nicht nur !loyaltyFollowSubEnabled) -- sonst abonniert diese Funktion
    // Follow/Subscribe/Gift-Sub ein zweites Mal, sobald der Alert Manager sie bereits oben
    // abonniert hat, und Twitch liefert jedes Ereignis doppelt aus (doppelte Aktivitäten-Feed-Eintraege).
    await subscribeToActivityFeedEvents(
      sessionId,
      broadcasterId,
      moderatorId ?? null,
      !needsFollowSubEvents
    )
  }
  // Raids braucht der Aktivitaetenfeed ebenso wie der Auto-Shoutout und der Alert Manager --
  // nur einmal abonnieren.
  if (activityFeedEnabled || isShoutoutFeatureEnabled() || hasEnabledAlertRules('raid')) {
    await subscribeToRaidEvents(sessionId, broadcasterId)
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
    } else if (eventType === 'channel.channel_points_custom_reward_redemption.update') {
      handleRedemptionUpdateEvent(eventData).catch((error) => {
        logger.error('Verarbeitung des Channel-Points-Redemption-Updates fehlgeschlagen', error)
      })
    } else if (eventType === 'channel.channel_points_automatic_reward_redemption.add') {
      if (isActivityFeedFeatureEnabled()) handleAutomaticRedemptionAddEvent(eventData)
    } else if (eventType === 'channel.poll.progress') {
      handlePollProgressEvent(eventData)
    } else if (eventType === 'channel.poll.end') {
      handlePollEndEvent(eventData)
    } else if (eventType === 'channel.follow') {
      if (isActivityFeedFeatureEnabled()) handleFollowActivityEvent(eventData)
      handleFollowEarnEvent(eventData)
      handleFollowAlert(eventData)
    } else if (eventType === 'channel.subscribe') {
      if (isActivityFeedFeatureEnabled()) handleSubActivityEvent(eventData)
      handleSubEarnEvent(eventData)
      handleSubAlert(eventData)
    } else if (eventType === 'channel.subscription.gift') {
      if (isActivityFeedFeatureEnabled()) handleGiftSubActivityEvent(eventData)
      handleGiftSubEarnEvent(eventData)
      handleGiftSubAlert(eventData)
    } else if (eventType === 'channel.subscription.message') {
      if (isActivityFeedFeatureEnabled()) handleResubActivityEvent(eventData)
    } else if (eventType === 'channel.cheer') {
      if (isActivityFeedFeatureEnabled()) handleCheerActivityEvent(eventData)
    } else if (eventType === 'channel.raid') {
      if (isActivityFeedFeatureEnabled()) handleRaidActivityEvent(eventData)
      handleRaidAlert(eventData)
      if (broadcasterId) {
        const raiderId = String(eventData.from_broadcaster_user_id ?? '')
        const raiderLogin = String(eventData.from_broadcaster_user_login ?? raiderId)
        handleRaidShoutout(broadcasterId, raiderId, raiderLogin).catch((error) => {
          logger.error('Auto-Shoutout nach Raid fehlgeschlagen', error)
        })
      }
    }
  }
}

function connect(url: string): void {
  ws = new WebSocket(url)
  ws.on('message', (data) => {
    handleMessage(data.toString())
  })
  ws.on('close', () => {
    clearKeepaliveWatchdog()
    if (!intentionalClose) {
      scheduleReconnect(reconnect)
    }
  })
  ws.on('error', (error) => {
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

function isActivityFeedFeatureEnabled(): boolean {
  return listFeatureScopes().some((f) => f.featureKey === 'activity_feed' && f.enabled)
}

/** Auto-Shoutout braucht EventSub nur, wenn Feature-Scope UND Auto-Shoutout aktiv sind. */
function isShoutoutFeatureEnabled(): boolean {
  return (
    listFeatureScopes().some((f) => f.featureKey === 'shoutout' && f.enabled) &&
    getAutoShoutoutEnabled()
  )
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
      isLoyaltyFollowSubFeatureEnabled() ||
      isActivityFeedFeatureEnabled() ||
      isShoutoutFeatureEnabled() ||
      hasEnabledAlertRules())

  if (shouldRun) {
    stopEventSub()
    await startEventSub()
  } else {
    stopEventSub()
  }
}
