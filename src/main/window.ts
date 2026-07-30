import { join } from 'path'
import { BrowserWindow, shell } from 'electron'
import { is } from '@electron-toolkit/utils'

let mainWindow: BrowserWindow | null = null

/** Erstellt (oder fokussiert) das Hauptfenster der App. */
export function createMainWindow(): BrowserWindow {
  if (mainWindow) {
    mainWindow.focus()
    return mainWindow
  }

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false,
      contextIsolation: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

/** Liefert das aktuelle Hauptfenster, falls vorhanden (z.B. für webContents.send). */
export function getMainWindow(): BrowserWindow | null {
  return mainWindow
}

/**
 * Erstellt ein separates, kurzlebiges Fenster für den Twitch-OAuth-Flow.
 * Wird in Phase 2 (src/main/twitch/oauth/oauthFlow.ts) genutzt.
 */
export function createOAuthWindow(url: string): BrowserWindow {
  const oauthWindow = new BrowserWindow({
    width: 500,
    height: 700,
    parent: mainWindow ?? undefined,
    modal: true,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      sandbox: true
    }
  })

  oauthWindow.loadURL(url)
  return oauthWindow
}
