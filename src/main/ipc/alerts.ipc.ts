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
import {
  listAlertRules,
  getAlertRuleById,
  createAlertRule,
  updateAlertRule,
  deleteAlertRule
} from '../db/repositories/alertRules.repo'
import { buildInstance } from '../alerts/alertRuleMatching'
import { clearQueue, enqueueAlert, isMuted, setMuted } from '../alerts/alertManagerService'

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

  handleTyped(IpcChannels.alerts.manager.list, () => listAlertRules())
  handleTyped(IpcChannels.alerts.manager.create, (input) => createAlertRule(input))
  handleTyped(IpcChannels.alerts.manager.update, ({ id, patch }) => updateAlertRule(id, patch))
  handleTyped(IpcChannels.alerts.manager.delete, ({ id }) => {
    deleteAlertRule(id)
  })
  handleTyped(IpcChannels.alerts.manager.test, ({ id }) => {
    const rule = getAlertRuleById(id)
    const sample = { user: 'TestUser', subcount: '5', viewers: '10' }
    enqueueAlert(buildInstance(rule, sample))
  })
  handleTyped(IpcChannels.alerts.manager.getMuted, () => isMuted())
  handleTyped(IpcChannels.alerts.manager.setMuted, ({ muted }) => {
    setMuted(muted)
  })
  handleTyped(IpcChannels.alerts.manager.clearQueue, () => {
    clearQueue()
  })

  handleTyped(IpcChannels.alerts.manager.pickMediaFile, async () => {
    const win = getMainWindow()
    const result = await dialog.showOpenDialog(win ?? undefined!, {
      title: 'Mediendatei auswählen',
      filters: [
        { name: 'Video, GIF, Bild', extensions: ['mp4', 'webm', 'mov', 'mkv', 'gif', 'png', 'jpg', 'jpeg', 'webp'] },
        { name: 'Alle Dateien', extensions: ['*'] }
      ],
      properties: ['openFile']
    })
    return result.canceled || !result.filePaths[0] ? null : result.filePaths[0]
  })

  handleTyped(IpcChannels.alerts.manager.pickAudioFile, async () => {
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
