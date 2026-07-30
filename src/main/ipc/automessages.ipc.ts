import { IpcChannels } from '@shared/ipc/channels'
import { handleTyped } from './handleTyped'
import {
  createAutomessage,
  deleteAutomessage,
  listAutomessages,
  updateAutomessage
} from '../db/repositories/automessages.repo'
import { restartAutomessageSchedulerIfConnected } from '../twitch/chat/tmiClient'

export function registerAutomessagesIpc(): void {
  handleTyped(IpcChannels.automessages.list, () => listAutomessages())

  handleTyped(IpcChannels.automessages.create, (input) => {
    const created = createAutomessage(input)
    restartAutomessageSchedulerIfConnected()
    return created
  })

  handleTyped(IpcChannels.automessages.update, ({ id, patch }) => {
    const updated = updateAutomessage(id, patch)
    restartAutomessageSchedulerIfConnected()
    return updated
  })

  handleTyped(IpcChannels.automessages.delete, ({ id }) => {
    deleteAutomessage(id)
    restartAutomessageSchedulerIfConnected()
  })
}
