import type { ChatUserstate } from 'tmi.js'
import type { Command, PermissionLevel } from '@shared/types/command'
import { incrementCommandUseCount, listCommands } from '../../db/repositories/commands.repo'
import {
  getLeaderboard,
  getLeaderboardEntry,
  getAccount,
  getOrCreateAccount,
  setAccountBlacklisted
} from '../../db/repositories/loyalty.repo'
import {
  adjustTracker,
  getTrackerCurrentValue,
  listTrackers
} from '../../db/repositories/trackers.repo'
import {
  findTrackerByPlaceholderKey,
  formatTrackerCurrentValue,
  WERT_PLACEHOLDER_PATTERN
} from '@shared/utils/wertPlaceholders'
import { pickRandomMessage } from '../../db/repositories/botMessages.repo'
import {
  getGameByTrigger,
  getGameRuntimeConfig,
  getGameRuntimeTexts,
  isGameEnabled
} from '../../loyalty/games/gameRegistry'
import { getLoyaltyEnabled } from '../../loyalty/loyaltySettings'
import { applyManualAdjustment } from '../../loyalty/loyaltyLedger'
import { LOYALTY_OFFLINE_MESSAGE_KEY } from '../../loyalty/offlineMessages'
import { isStreamLive } from '../../stats/viewerCountPoller'
import { getActiveChatClient } from './chatClientAccessor'
import { getLocale } from '../../locale'
import { logger } from '../../logger'
import { sendWhisper } from '../helix/whispers.api'
import { resolveBuiltInLoyaltyCommand } from './loyaltyCommandTriggers'

const PERMISSION_ORDER: PermissionLevel[] = ['everyone', 'subscriber', 'moderator', 'broadcaster']

/** Fixer, nicht umbenennbarer Trigger fuer den eingebauten Mod-Command. */
const BLACKLIST_TRIGGER = '!blacklist'

/** Cooldown-Tracking pro Command, rein in-memory (nicht persistiert, resettet bei App-Neustart). */
const lastUsedAt = new Map<number, number>()

function getUserPermissionLevel(tags: ChatUserstate): PermissionLevel {
  if (tags.badges?.broadcaster === '1') return 'broadcaster'
  if (tags.mod) return 'moderator'
  if (tags.subscriber) return 'subscriber'
  return 'everyone'
}

function hasRequiredPermission(userLevel: PermissionLevel, required: PermissionLevel): boolean {
  return PERMISSION_ORDER.indexOf(userLevel) >= PERMISSION_ORDER.indexOf(required)
}

function chatText(
  key:
    | 'points'
    | 'pointsOther'
    | 'pointsUnknown'
    | 'rank'
    | 'rankEmpty'
    | 'adminUsage'
    | 'adminDone'
    | 'adminInvalid'
): string {
  const locale = getLocale()
  const texts = {
    de: {
      points: '@{user} du hast {points} Punkte.',
      pointsOther: '@{requester} @{target} hat {points} Punkte.',
      pointsUnknown: '@{requester} fuer @{target} gibt es kein Loyalty-Konto.',
      rank: 'Top 10: {top}. @{user} dein Rang: #{rank} mit {points} Punkten.',
      rankEmpty: 'Es gibt noch keine Loyalty-Konten.',
      adminUsage: 'Nutzung: !punkteadmin <nutzer> <betrag>',
      adminDone: '@{target} wurde um {amount} Punkte angepasst. Neuer Stand: {points}.',
      adminInvalid: 'Betrag muss eine Zahl ungleich 0 sein.'
    },
    en: {
      points: '@{user} you have {points} points.',
      pointsOther: '@{requester} @{target} has {points} points.',
      pointsUnknown: '@{requester} there is no loyalty account for @{target}.',
      rank: 'Top 10: {top}. @{user} your rank: #{rank} with {points} points.',
      rankEmpty: 'There are no loyalty accounts yet.',
      adminUsage: 'Usage: !pointsadmin <user> <amount>',
      adminDone: '@{target} was adjusted by {amount} points. New balance: {points}.',
      adminInvalid: 'Amount must be a non-zero number.'
    }
  } as const
  return texts[locale][key]
}

function fill(template: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
    template
  )
}

function pickTextVariant(texts: Record<string, string[]>, slot: string): string {
  const variants = texts[slot] ?? []
  if (variants.length === 0) return ''
  return variants[Math.floor(Math.random() * variants.length)]
}

function getTagLogin(tags: ChatUserstate): string | null {
  const login = tags.username?.trim().toLowerCase()
  return login ? login : null
}

/**
 * Ersetzt {wert:ID}/{wert:label_id}-Platzhalter sowie {alter_wert}/{neuer_wert}.
 * Nicht gefundene Werte werden durch einen leeren String ersetzt.
 */
function resolveResponse(
  response: string,
  oldValues: Record<number, string> = {},
  newValues: Record<number, string> = {}
): string {
  let result = response

  const firstOldValue = Object.values(oldValues)[0]
  const firstNewValue = Object.values(newValues)[0]
  if (firstOldValue !== undefined) result = result.replaceAll('{alter_wert}', firstOldValue)
  if (firstNewValue !== undefined) result = result.replaceAll('{neuer_wert}', firstNewValue)

  result = result.replace(/\{old:(\d+)\}/g, (_, rawId: string) => oldValues[Number(rawId)] ?? '')
  result = result.replace(/\{new:(\d+)\}/g, (_, rawId: string) => newValues[Number(rawId)] ?? '')

  const trackers = listTrackers()
  result = result.replace(WERT_PLACEHOLDER_PATTERN, (_, rawKey: string) => {
    const tracker = findTrackerByPlaceholderKey(trackers, rawKey)
    return tracker ? formatTrackerCurrentValue(tracker) : ''
  })

  return result
}

/**
 * Verarbeitet eingehende Chat-Nachrichten: prüft auf `!trigger`, matched gegen
 * Commands (inkl. Aliase), prüft Permission-Level + Cooldown, sendet die Response.
 * Antworten werden über den aktiven Chat-Client gesendet (Mod wenn verbunden, sonst Broadcaster).
 */
export async function handleChatMessage(
  channel: string,
  tags: ChatUserstate,
  message: string
): Promise<void> {
  if (!message.startsWith('!')) return

  const sender = getActiveChatClient()
  if (!sender) return

  const parts = message.trim().split(/\s+/)
  const trigger = parts[0].toLowerCase()
  const loyaltyCommand = resolveBuiltInLoyaltyCommand(trigger)

  // Eingebauter Mod-Command, ausserhalb des Game-/Custom-Command-Systems, damit er nie
  // durch einen umbenannten Custom-Command ueberschattet werden kann.
  if (trigger === BLACKLIST_TRIGGER) {
    if (!hasRequiredPermission(getUserPermissionLevel(tags), 'moderator')) return
    const targetLogin = parts[1]?.replace(/^@/, '').toLowerCase()
    if (!targetLogin) return
    getOrCreateAccount(targetLogin)
    setAccountBlacklisted(targetLogin, true)
    await sender.say(channel, `🚫 ${targetLogin} wurde blacklisted.`)
    return
  }

  if (loyaltyCommand === 'points') {
    if (!getLoyaltyEnabled()) return
    const requester = getTagLogin(tags)
    if (!requester) return
    const requesterAccount = getOrCreateAccount(requester)
    if (requesterAccount.isBlacklisted) return

    const requestedLogin = parts[1]?.replace(/^@/, '').toLowerCase()
    if (requestedLogin && requestedLogin !== requester) {
      const requestedAccount = getAccount(requestedLogin)
      if (!requestedAccount || requestedAccount.isBlacklisted) {
        await sender.say(
          channel,
          fill(chatText('pointsUnknown'), { requester, target: requestedLogin })
        )
        return
      }
      await sender.say(
        channel,
        fill(chatText('pointsOther'), {
          requester,
          target: requestedAccount.userLogin,
          points: requestedAccount.balance
        })
      )
      return
    }

    await sender.say(
      channel,
      fill(chatText('points'), {
        user: requesterAccount.userLogin,
        points: requesterAccount.balance
      })
    )
    return
  }

  if (loyaltyCommand === 'rank') {
    if (!getLoyaltyEnabled()) return
    const login = getTagLogin(tags)
    if (!login) return
    const account = getOrCreateAccount(login)
    if (account.isBlacklisted) return
    const leaderboard = getLeaderboard(10)
    const ownRank = getLeaderboardEntry(account.userLogin)
    if (!ownRank || leaderboard.length === 0) {
      await sender.say(channel, chatText('rankEmpty'))
      return
    }
    const top = leaderboard
      .map((entry) => `#${entry.rank} ${entry.userLogin} (${entry.balance})`)
      .join(', ')
    await sender.say(
      channel,
      fill(chatText('rank'), {
        top,
        user: ownRank.userLogin,
        rank: ownRank.rank,
        points: ownRank.balance
      })
    )
    return
  }

  if (loyaltyCommand === 'pointsAdmin') {
    if (!hasRequiredPermission(getUserPermissionLevel(tags), 'moderator')) return
    const targetLogin = parts[1]?.replace(/^@/, '').toLowerCase()
    const amount = Number(parts[2])
    if (!targetLogin) {
      await sender.say(channel, chatText('adminUsage'))
      return
    }
    if (!Number.isFinite(amount) || amount === 0) {
      await sender.say(channel, chatText('adminInvalid'))
      return
    }
    applyManualAdjustment([targetLogin], Math.trunc(amount))
    const updated = getOrCreateAccount(targetLogin)
    await sender.say(
      channel,
      fill(chatText('adminDone'), {
        target: updated.userLogin,
        amount: Math.trunc(amount),
        points: updated.balance
      })
    )
    return
  }

  const match = getGameByTrigger(trigger)
  if (match) {
    const { game, command } = match
    if (!getLoyaltyEnabled() || !isGameEnabled(game.id)) return
    // Loyalty-Games laufen nur, waehrend der Stream live ist -- offline gibt es
    // stattdessen eine launige "geschlossen"-Meldung statt der Ausfuehrung.
    if (!isStreamLive()) {
      const offlineMessage = pickRandomMessage(LOYALTY_OFFLINE_MESSAGE_KEY)
      if (offlineMessage) await sender.say(channel, offlineMessage)
      return
    }
    // Geblacklistete Konten (z.B. Bots) sind komplett von Loyalty-Games ausgeschlossen.
    const login = getTagLogin(tags)
    if (!login || getOrCreateAccount(login).isBlacklisted) return
    const gameTexts = getGameRuntimeTexts(game.id)
    await command.handleCommand({
      userLogin: login,
      args: parts.slice(1),
      reply: (text) =>
        getActiveChatClient()
          ?.say(channel, text)
          .then(() => undefined) ?? Promise.resolve(),
      whisper: sendWhisper,
      config: getGameRuntimeConfig(game.id),
      text: (slot, fallback, values = {}) =>
        fill(pickTextVariant(gameTexts, slot) || fallback, values)
    })
    return
  }

  const commands = listCommands()
  const command = commands.find(
    (c) => c.enabled && (c.trigger.toLowerCase() === trigger || c.aliases.includes(trigger))
  )
  if (!command) return

  const userLevel = getUserPermissionLevel(tags)
  if (!hasRequiredPermission(userLevel, command.permissionLevel)) return

  const now = Date.now()
  if (userLevel !== 'broadcaster') {
    const lastUsed = lastUsedAt.get(command.id) ?? 0
    if (now - lastUsed < command.cooldownSeconds * 1000) return
  }
  lastUsedAt.set(command.id, now)

  try {
    const oldValues: Record<number, string> = {}
    const newValues: Record<number, string> = {}
    const trackerActions = command.trackerActions.length
      ? command.trackerActions
      : command.trackerId && command.trackerAction
        ? [{ trackerId: command.trackerId, action: command.trackerAction }]
        : []

    for (const trackerAction of trackerActions) {
      oldValues[trackerAction.trackerId] = getTrackerCurrentValue(trackerAction.trackerId)
      const delta = trackerAction.action === 'increment' ? 1 : -1
      adjustTracker(trackerAction.trackerId, delta)
      newValues[trackerAction.trackerId] = getTrackerCurrentValue(trackerAction.trackerId)
    }

    const resolvedResponse = resolveResponse(command.response, oldValues, newValues)
    await sendCommandResponse(channel, tags.username ?? '', command, resolvedResponse)
    incrementCommandUseCount(command.id)
  } catch (error) {
    logger.error(`Konnte Command-Response für "${command.trigger}" nicht senden`, error)
  }
}

/**
 * Versendet die Command-Antwort gemäß konfigurierter Zustellart über den aktiven Client.
 * Whisper hängt von Twitch-seitigen Einschränkungen ab (seit 2023 eingeschränkt) --
 * Fehler werden vom Aufrufer geloggt, nicht hier verschluckt.
 */
async function sendCommandResponse(
  channel: string,
  userLogin: string,
  command: Command,
  resolvedResponse: string
): Promise<void> {
  const sender = getActiveChatClient()
  if (!sender) return

  switch (command.deliveryMode) {
    case 'whisper':
      await sendWhisper(userLogin, resolvedResponse)
      return
    case 'mention':
      await sender.say(channel, `@${userLogin} ${resolvedResponse}`)
      return
    default:
      await sender.say(channel, resolvedResponse)
  }
}
