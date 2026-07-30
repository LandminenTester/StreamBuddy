import { IpcChannels } from '@shared/ipc/channels'
import { handleTyped } from './handleTyped'
import {
  createPollTemplate,
  deletePollTemplate,
  listPollTemplates,
  updatePollTemplate
} from '../db/repositories/pollTemplates.repo'

export function registerPollTemplatesIpc(): void {
  handleTyped(IpcChannels.pollTemplates.list, () => listPollTemplates())

  handleTyped(IpcChannels.pollTemplates.create, (input) => createPollTemplate(input))

  handleTyped(IpcChannels.pollTemplates.update, ({ id, input }) => updatePollTemplate(id, input))

  handleTyped(IpcChannels.pollTemplates.delete, ({ id }) => deletePollTemplate(id))
}
