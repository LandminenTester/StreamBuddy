import type { Command, CommandDeliveryMode, PermissionLevel } from '@shared/types/command'
import type { SelectOption } from '@renderer/components/ui/AppSelect.vue'
import { t } from '@renderer/i18n'
import type { CommandFormState } from './types'

const PERMISSION_LEVELS: PermissionLevel[] = ['everyone', 'subscriber', 'moderator', 'broadcaster']
const DELIVERY_MODES: CommandDeliveryMode[] = ['public', 'mention', 'whisper']

export function permissionLabel(level: PermissionLevel): string {
  return t(`commands.permission.${level}`)
}

export function deliveryModeLabel(mode: CommandDeliveryMode): string {
  return t(`commands.delivery.${mode}`)
}

export function permissionOptions(): SelectOption[] {
  return PERMISSION_LEVELS.map((value) => ({ value, label: permissionLabel(value) }))
}

export function deliveryModeOptions(): SelectOption[] {
  return DELIVERY_MODES.map((value) => ({ value, label: deliveryModeLabel(value) }))
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
