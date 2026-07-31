import { app, BrowserWindow } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { createMainWindow } from './window'
import { registerIpcHandlers } from './ipc/registerIpcHandlers'
import { getDb } from './db/connection'
import { syncFeatureScopes } from './twitch/oauth/scopeRegistry'
import { connectChatClient } from './twitch/chat/tmiClient'
import { syncEventSubConnection } from './twitch/eventsub/eventSubClient'
import { seedLoyaltyDefaults } from './loyalty/seedDefaults'
import { checkForUpdate, initUpdater } from './updater'
import { logger } from './logger'

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.vinewoodlegacy.streamingbot')

  app.on('browser-window-created', (_event, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  getDb()
  syncFeatureScopes()
  seedLoyaltyDefaults()
  registerIpcHandlers()
  createMainWindow()
  void connectChatClient()
  void syncEventSubConnection()

  initUpdater()
  // Verzoegert, damit der Update-Check nicht mit dem App-Start um Ressourcen konkurriert.
  setTimeout(() => void checkForUpdate(), 5000)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', reason)
})
