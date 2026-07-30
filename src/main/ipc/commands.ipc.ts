import { IpcChannels } from '@shared/ipc/channels'
import { handleTyped } from './handleTyped'
import {
  createCommand,
  deleteCommand,
  listCommands,
  updateCommand
} from '../db/repositories/commands.repo'

export function registerCommandsIpc(): void {
  handleTyped(IpcChannels.commands.list, () => listCommands())
  handleTyped(IpcChannels.commands.create, (input) => createCommand(input))
  handleTyped(IpcChannels.commands.update, ({ id, patch }) => updateCommand(id, patch))
  handleTyped(IpcChannels.commands.delete, ({ id }) => {
    deleteCommand(id)
  })
}
