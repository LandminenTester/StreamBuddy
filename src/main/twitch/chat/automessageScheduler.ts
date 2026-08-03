import { listAutomessages, touchAutomessageLastSent } from '../../db/repositories/automessages.repo'
import { listCommands } from '../../db/repositories/commands.repo'
import { getActiveChatClient } from './chatClientAccessor'
import { logger } from '../../logger'

let activeChannel: string | null = null

const intervalTimers = new Map<number, NodeJS.Timeout>()
const rotationIndex = new Map<number, number>()
/** Chat-Zeilen seit der letzten Sendung, pro Automessage -- Basis für beide Modi. */
const linesSinceLastSent = new Map<number, number>()
const COMMAND_PLACEHOLDER_PATTERN = /\{command:([^}]+)\}/gi
const MAX_AUTOMESSAGE_LENGTH = 450

function nextRotationMessage(automessageId: number, messages: string[]): string {
  const index = rotationIndex.get(automessageId) ?? 0
  const message = messages[index % messages.length]
  rotationIndex.set(automessageId, (index + 1) % messages.length)
  return message
}

function resolveCommandPlaceholders(message: string): string {
  const commands = listCommands()
  return message
    .replace(COMMAND_PLACEHOLDER_PATTERN, (placeholder, rawTrigger: string) => {
      const trigger = rawTrigger.trim().toLowerCase()
      const command = commands.find(
        (candidate) =>
          candidate.enabled &&
          (candidate.trigger.toLowerCase() === trigger ||
            candidate.aliases.some((alias) => alias.toLowerCase() === trigger))
      )
      return command ? command.response : placeholder
    })
    .slice(0, MAX_AUTOMESSAGE_LENGTH)
}

async function sendAutomessage(id: number, messages: string[]): Promise<void> {
  const sender = getActiveChatClient()
  if (!sender || !activeChannel || messages.length === 0) return

  const message = resolveCommandPlaceholders(nextRotationMessage(id, messages))

  try {
    await sender.say(activeChannel, message)
    touchAutomessageLastSent(id, Date.now())
    linesSinceLastSent.set(id, 0)
  } catch (error) {
    logger.error(`Konnte Automessage id=${id} nicht senden`, error)
  }
}

function clearIntervalTimers(): void {
  for (const timer of intervalTimers.values()) clearInterval(timer)
  intervalTimers.clear()
}

/** Startet Interval-Timer für alle aktiven interval-Automessages. Aufgerufen bei Chat-Connect. */
export function startAutomessageScheduler(channel: string): void {
  activeChannel = channel
  clearIntervalTimers()

  for (const automessage of listAutomessages()) {
    if (!automessage.enabled || automessage.mode !== 'interval' || !automessage.intervalMinutes) {
      continue
    }

    linesSinceLastSent.set(automessage.id, automessage.minChatLinesSinceLast)

    const timer = setInterval(
      () => {
        const linesSoFar = linesSinceLastSent.get(automessage.id) ?? 0
        if (linesSoFar >= automessage.minChatLinesSinceLast) {
          void sendAutomessage(automessage.id, automessage.messages)
        }
      },
      automessage.intervalMinutes * 60 * 1000
    )

    intervalTimers.set(automessage.id, timer)
  }
}

export function stopAutomessageScheduler(): void {
  clearIntervalTimers()
  rotationIndex.clear()
  linesSinceLastSent.clear()
  activeChannel = null
}

/**
 * Wird bei jeder eingehenden Chat-Nachricht aufgerufen: erhöht die Zeilen-Zähler
 * (für den min_chat_lines_since_last-Schutz im interval-Modus) und prüft
 * message_count-Automessages auf ihren Schwellenwert.
 */
export function recordChatLineForAutomessages(): void {
  for (const automessage of listAutomessages()) {
    if (!automessage.enabled) continue

    const current = (linesSinceLastSent.get(automessage.id) ?? 0) + 1
    linesSinceLastSent.set(automessage.id, current)

    if (
      automessage.mode === 'message_count' &&
      automessage.messageCountThreshold &&
      current >= automessage.messageCountThreshold
    ) {
      void sendAutomessage(automessage.id, automessage.messages)
    }
  }
}
