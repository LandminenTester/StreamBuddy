import type { PermissionLevel } from '@shared/types/command'

export interface CommandFormState {
  id: number | null
  trigger: string
  response: string
  aliasesInput: string
  permissionLevel: PermissionLevel
  cooldownSeconds: number
  enabled: boolean
}

export function emptyCommandForm(): CommandFormState {
  return {
    id: null,
    trigger: '',
    response: '',
    aliasesInput: '',
    permissionLevel: 'everyone',
    cooldownSeconds: 5,
    enabled: true
  }
}
