import type { CommandDeliveryMode, PermissionLevel } from '@shared/types/command'
import type { CommandTrackerAction } from '@shared/types/command'
import type { TrackerAction } from '@shared/types/tracker'

export interface CommandFormState {
  id: number | null
  trigger: string
  response: string
  aliasesInput: string
  permissionLevel: PermissionLevel
  cooldownSeconds: number
  deliveryMode: CommandDeliveryMode
  enabled: boolean
  trackerId: number | null
  trackerAction: TrackerAction | null
  trackerActions: CommandTrackerAction[]
  effectId: number | null
}

export function emptyCommandForm(): CommandFormState {
  return {
    id: null,
    trigger: '',
    response: '',
    aliasesInput: '',
    permissionLevel: 'everyone',
    cooldownSeconds: 5,
    deliveryMode: 'public',
    enabled: true,
    trackerId: null,
    trackerAction: null,
    trackerActions: [],
    effectId: null
  }
}
