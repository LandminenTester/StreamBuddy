import type { Command, CommandDeliveryMode, PermissionLevel } from '@shared/types/command'
import type { CommandFormState } from './types'

export const PERMISSION_LABELS: Record<PermissionLevel, string> = {
  everyone: 'Alle',
  subscriber: 'Subscriber',
  moderator: 'Moderator',
  broadcaster: 'Broadcaster'
}

export const DELIVERY_MODE_LABELS: Record<CommandDeliveryMode, string> = {
  public: 'Öffentlich im Chat',
  mention: 'Erwähnung (für ihn sichtbar)',
  whisper: 'Whisper (privat)'
}

export function commandToFormState(command: Command): CommandFormState {
  return {
    id: command.id,
    trigger: command.trigger,
    response: command.response,
    aliasesInput: command.aliases.join(', '),
    permissionLevel: command.permissionLevel,
    cooldownSeconds: command.cooldownSeconds,
    deliveryMode: command.deliveryMode,
    enabled: command.enabled
  }
}

export function parseAliases(aliasesInput: string): string[] {
  return aliasesInput
    .split(',')
    .map((alias) => alias.trim().toLowerCase())
    .filter((alias) => alias.length > 0)
}

export function normalizeTrigger(trigger: string): string {
  const trimmed = trigger.trim().toLowerCase()
  return trimmed.startsWith('!') ? trimmed : `!${trimmed}`
}
