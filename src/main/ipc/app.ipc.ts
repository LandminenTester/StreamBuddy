import { app, dialog } from 'electron'
import { basename } from 'path'
import { readFile, writeFile } from 'fs/promises'
import { IpcChannels } from '@shared/ipc/channels'
import { handleTyped } from './handleTyped'
import { getAppMetadata } from '../appMetadata'
import { getChangelog } from '../changelog'
import { checkForUpdate, downloadUpdate, installUpdate } from '../updater'
import { applyTheme, getAccent, getTheme, setAccent, setTheme } from '../theme'
import { getLocale, setLocale } from '../locale'
import { completeSetup, getSetupState, resetSetup } from '../setup'
import { seedBotTextsForLocale } from '../loyalty/botTexts'
import { createSettingsBackup, importSettingsBackup, parseSettingsBackup, resetAllApplicationData } from '../settings/backup'
import { getMainWindow } from '../window'
import { disconnectChatClient } from '../twitch/chat/tmiClient'
import { stopEventSub } from '../twitch/eventsub/eventSubClient'
import { stopFollowerSyncScheduler } from '../twitch/followers/followerSync'
import { syncFeatureScopes } from '../twitch/oauth/scopeRegistry'

export function registerAppIpc(): void {
  handleTyped(IpcChannels.app.getVersion, () => app.getVersion())

  handleTyped(IpcChannels.app.getMetadata, () => getAppMetadata())

  handleTyped(IpcChannels.app.getChangelog, () => getChangelog())

  handleTyped(IpcChannels.app.checkForUpdate, async () => {
    await checkForUpdate()
  })

  handleTyped(IpcChannels.app.downloadUpdate, async () => {
    await downloadUpdate()
  })

  handleTyped(IpcChannels.app.installUpdate, () => {
    installUpdate()
  })

  handleTyped(IpcChannels.app.getTheme, () => getTheme())

  handleTyped(IpcChannels.app.setTheme, ({ theme }) => {
    setTheme(theme)
    applyTheme(theme)
  })

  handleTyped(IpcChannels.app.getAccent, () => getAccent())

  handleTyped(IpcChannels.app.setAccent, ({ accent }) => {
    setAccent(accent)
  })

  handleTyped(IpcChannels.app.getLocale, () => getLocale())

  handleTyped(IpcChannels.app.setLocale, ({ locale }) => {
    setLocale(locale)
  })

  handleTyped(IpcChannels.app.getSetupState, () => getSetupState())

  handleTyped(IpcChannels.app.completeSetup, ({ locale }) => completeSetup(locale))

  handleTyped(IpcChannels.app.resetSetup, () => resetSetup())

  // Bewusst separater Kanal: ein Sprachwechsel in den Einstellungen laesst die
  // Bot-Texte in Ruhe, das Zuruecksetzen muss explizit angestossen werden.
  handleTyped(IpcChannels.app.resetBotTexts, ({ locale }) => {
    seedBotTextsForLocale(locale)
  })

  handleTyped(IpcChannels.app.exportSettings, async () => {
    const window = getMainWindow()
    const result = window
      ? await dialog.showSaveDialog(window, {
          title: 'StreamBuddy-Einstellungen exportieren',
          defaultPath: 'streambuddy-settings.json',
          filters: [{ name: 'StreamBuddy-Einstellungen', extensions: ['json'] }]
        })
      : await dialog.showSaveDialog({
          title: 'StreamBuddy-Einstellungen exportieren',
          defaultPath: 'streambuddy-settings.json',
          filters: [{ name: 'StreamBuddy-Einstellungen', extensions: ['json'] }]
        })

    if (result.canceled || !result.filePath) return null
    await writeFile(result.filePath, JSON.stringify(createSettingsBackup(), null, 2), 'utf-8')
    return { fileName: basename(result.filePath) }
  })

  handleTyped(IpcChannels.app.importSettings, async () => {
    const window = getMainWindow()
    const result = window
      ? await dialog.showOpenDialog(window, {
          title: 'StreamBuddy-Einstellungen importieren',
          filters: [{ name: 'StreamBuddy-Einstellungen', extensions: ['json'] }],
          properties: ['openFile']
        })
      : await dialog.showOpenDialog({
          title: 'StreamBuddy-Einstellungen importieren',
          filters: [{ name: 'StreamBuddy-Einstellungen', extensions: ['json'] }],
          properties: ['openFile']
        })

    if (result.canceled || result.filePaths.length === 0) return null
    const backup = parseSettingsBackup(await readFile(result.filePaths[0], 'utf-8'))
    importSettingsBackup(backup)
    return { fileName: basename(result.filePaths[0]) }
  })

  handleTyped(IpcChannels.app.resetAll, async () => {
    await disconnectChatClient()
    stopEventSub()
    stopFollowerSyncScheduler()
    resetAllApplicationData()
    syncFeatureScopes()
    return getSetupState()
  })
}
