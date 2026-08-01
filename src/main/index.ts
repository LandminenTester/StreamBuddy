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
import { applyTheme, getTheme } from './theme'
import { logger } from './logger'
import { setPresenceCallbacks } from './twitch/chat/presenceTracker'
import { onUserJoined, onUserLeft } from './twitch/viewers/viewerSessionTracker'
import { startFollowerSyncScheduler } from './twitch/followers/followerSync'

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.vinewoodlegacy.streambuddy')

  app.on('browser-window-created', (_event, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  getDb()
  applyTheme(getTheme())
  syncFeatureScopes()
  seedLoyaltyDefaults()
  registerIpcHandlers()
  createMainWindow()

  setPresenceCallbacks({ onJoined: onUserJoined, onLeft: onUserLeft })

  void connectChatClient()
  void syncEventSubConnection()
  startFollowerSyncScheduler()

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
