import type { ChatUserstate } from 'tmi.js'
import type { Command, PermissionLevel } from '@shared/types/command'
import { incrementCommandUseCount, listCommands } from '../../db/repositories/commands.repo'
import { getOrCreateAccount, setAccountBlacklisted } from '../../db/repositories/loyalty.repo'
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
  isGameEnabled
} from '../../loyalty/games/gameRegistry'
import { getLoyaltyEnabled } from '../../loyalty/loyaltySettings'
import { LOYALTY_OFFLINE_MESSAGE_KEY } from '../../loyalty/offlineMessages'
import { isStreamLive } from '../../stats/viewerCountPoller'
import { getActiveChatClient } from './chatClientAccessor'
import { logger } from '../../logger'

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

/**
 * Ersetzt {wert:ID}/{wert:label_id}-Platzhalter sowie {alter_wert}/{neuer_wert}.
 * Nicht gefundene Werte werden durch einen leeren String ersetzt.
 */
function resolveResponse(
  response: string,
  oldValue?: string,
  newValue?: string
): string {
  let result = response

  if (oldValue !== undefined) result = result.replaceAll('{alter_wert}', oldValue)
  if (newValue !== undefined) result = result.replaceAll('{neuer_wert}', newValue)

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
    if (getOrCreateAccount(tags.username ?? '').isBlacklisted) return
    await command.handleCommand({
      userLogin: tags.username ?? '',
      args: parts.slice(1),
      reply: (text) => getActiveChatClient()?.say(channel, text).then(() => undefined) ?? Promise.resolve(),
      config: getGameRuntimeConfig(game.id)
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
    let oldValue: string | undefined
    let newValue: string | undefined

    if (command.trackerId && command.trackerAction) {
      oldValue = getTrackerCurrentValue(command.trackerId)
      const delta = command.trackerAction === 'increment' ? 1 : -1
      adjustTracker(command.trackerId, delta)
      newValue = getTrackerCurrentValue(command.trackerId)
    }

    const resolvedResponse = resolveResponse(command.response, oldValue, newValue)
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
      await sender.whisper(userLogin, resolvedResponse)
      return
    case 'mention':
      await sender.say(channel, `@${userLogin} ${resolvedResponse}`)
      return
    default:
      await sender.say(channel, resolvedResponse)
  }
}
