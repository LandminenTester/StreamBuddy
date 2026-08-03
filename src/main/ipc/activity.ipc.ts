import { IpcChannels } from '@shared/ipc/channels'
import { handleTyped } from './handleTyped'
import { clearActivityEvents, listActivityEvents } from '../db/repositories/activity.repo'

export function registerActivityIpc(): void {
  handleTyped(IpcChannels.activity.list, (request) => listActivityEvents(request ?? {}))
  handleTyped(IpcChannels.activity.clear, () => clearActivityEvents())
}
