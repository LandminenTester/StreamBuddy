import { dialog } from 'electron'
import { IpcChannels } from '@shared/ipc/channels'
import { handleTyped } from './handleTyped'
import {
  listEffects,
  createEffect,
  updateEffect,
  deleteEffect
} from '../db/repositories/effects.repo'
import { triggerEffect } from '../alerts/effectsService'
import { getServerPort } from '../alerts/effectsServer'
import { getMainWindow } from '../window'

export function registerAlertsIpc(): void {
  handleTyped(IpcChannels.alerts.list, () => listEffects())
  handleTyped(IpcChannels.alerts.create, (input) => createEffect(input))
  handleTyped(IpcChannels.alerts.update, ({ id, patch }) => updateEffect(id, patch))
  handleTyped(IpcChannels.alerts.delete, ({ id }) => {
    deleteEffect(id)
  })
  handleTyped(IpcChannels.alerts.trigger, ({ id }) => {
    triggerEffect(id)
  })
  handleTyped(IpcChannels.alerts.getServerPort, () => getServerPort())

  handleTyped(IpcChannels.alerts.pickVideoFile, async () => {
    const win = getMainWindow()
    const result = await dialog.showOpenDialog(win ?? undefined!, {
      title: 'Videodatei auswählen',
      filters: [
        { name: 'Videodateien', extensions: ['mp4', 'webm', 'mov', 'mkv'] },
        { name: 'Alle Dateien', extensions: ['*'] }
      ],
      properties: ['openFile']
    })
    return result.canceled || !result.filePaths[0] ? null : result.filePaths[0]
  })

  handleTyped(IpcChannels.alerts.pickAudioFile, async () => {
    const win = getMainWindow()
    const result = await dialog.showOpenDialog(win ?? undefined!, {
      title: 'Audiodatei auswählen',
      filters: [
        { name: 'Audiodateien', extensions: ['mp3', 'wav', 'ogg', 'flac'] },
        { name: 'Alle Dateien', extensions: ['*'] }
      ],
      properties: ['openFile']
    })
    return result.canceled || !result.filePaths[0] ? null : result.filePaths[0]
  })
}
