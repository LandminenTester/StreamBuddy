import { app } from 'electron'
import { IpcChannels } from '@shared/ipc/channels'
import { handleTyped } from './handleTyped'
import { getAppMetadata } from '../appMetadata'
import { getChangelog } from '../changelog'
import { checkForUpdate, installUpdate } from '../updater'

export function registerAppIpc(): void {
  handleTyped(IpcChannels.app.getVersion, () => app.getVersion())

  handleTyped(IpcChannels.app.getMetadata, () => getAppMetadata())

  handleTyped(IpcChannels.app.getChangelog, () => getChangelog())

  handleTyped(IpcChannels.app.checkForUpdate, async () => {
    await checkForUpdate()
  })

  handleTyped(IpcChannels.app.installUpdate, () => {
    installUpdate()
  })
}
