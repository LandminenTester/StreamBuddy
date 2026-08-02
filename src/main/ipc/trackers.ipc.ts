import { IpcChannels } from '@shared/ipc/channels'
import { handleTyped } from './handleTyped'
import {
  adjustTracker,
  createTracker,
  deleteTracker,
  listTrackers,
  updateTracker
} from '../db/repositories/trackers.repo'

export function registerTrackersIpc(): void {
  handleTyped(IpcChannels.trackers.list, () => listTrackers())

  handleTyped(IpcChannels.trackers.create, (input) => createTracker(input))

  handleTyped(IpcChannels.trackers.update, ({ id, patch }) => updateTracker(id, patch))

  handleTyped(IpcChannels.trackers.delete, ({ id }) => {
    deleteTracker(id)
  })

  handleTyped(IpcChannels.trackers.adjust, ({ id, delta }) => adjustTracker(id, delta))

  handleTyped(IpcChannels.trackers.setTextValue, ({ id, value }) =>
    updateTracker(id, { textValue: value })
  )
}
