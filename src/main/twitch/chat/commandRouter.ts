import type { ChatUserstate, Client } from 'tmi.js'
import type { Command, PermissionLevel } from '@shared/types/command'
import { incrementCommandUseCount, listCommands } from '../../db/repositories/commands.repo'
import { getOrCreateAccount } from '../../db/repositories/loyalty.repo'
import {
  getGameByTrigger,
  getGameRuntimeConfig,
  isGameEnabled
} from '../../loyalty/games/gameRegistry'
import { logger } from '../../logger'

const PERMISSION_ORDER: PermissionLevel[] = ['everyone', 'subscriber', 'moderator', 'broadcaster']

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
 * Verarbeitet eingehende Chat-Nachrichten: prüft auf `!trigger`, matched gegen
 * Commands (inkl. Aliase), prüft Permission-Level + Cooldown, sendet die Response.
 */
export async function handleChatMessage(
  client: Client,
  channel: string,
  tags: ChatUserstate,
  message: string
): Promise<void> {
  if (!message.startsWith('!')) return

  const parts = message.trim().split(/\s+/)
  const trigger = parts[0].toLowerCase()

  const game = getGameByTrigger(trigger)
  if (game) {
    if (!isGameEnabled(game.id)) return
    // Geblacklistete Konten (z.B. Bots) sind komplett von Loyalty-Games ausgeschlossen.
    if (getOrCreateAccount(tags.username ?? '').isBlacklisted) return
    await game.handleCommand({
      userLogin: tags.username ?? '',
      args: parts.slice(1),
      reply: (text) => client.say(channel, text).then(() => undefined),
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

  const lastUsed = lastUsedAt.get(command.id) ?? 0
  const now = Date.now()
  if (now - lastUsed < command.cooldownSeconds * 1000) return
  lastUsedAt.set(command.id, now)

  try {
    await sendCommandResponse(client, channel, tags.username ?? '', command)
    incrementCommandUseCount(command.id)
  } catch (error) {
    logger.error(`Konnte Command-Response für "${command.trigger}" nicht senden`, error)
  }
}

/**
 * Versendet die Command-Antwort gemäß konfigurierter Zustellart. Whisper hängt von
 * Twitch-seitigen Einschränkungen für den Bot-Account ab (seit 2023 für viele
 * Accounts eingeschränkt) -- Fehler werden vom Aufrufer geloggt, nicht hier verschluckt.
 */
async function sendCommandResponse(
  client: Client,
  channel: string,
  userLogin: string,
  command: Command
): Promise<void> {
  switch (command.deliveryMode) {
    case 'whisper':
      await client.whisper(userLogin, command.response)
      return
    case 'mention':
      await client.say(channel, `@${userLogin} ${command.response}`)
      return
    default:
      await client.say(channel, command.response)
  }
}
