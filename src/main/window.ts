import { join } from 'path'
import { app, BrowserWindow, shell } from 'electron'
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

  // Verhindert, dass der <title> der geladenen Seite den gewuenschten Fenstertitel ueberschreibt.
  mainWindow.on('page-title-updated', (event) => {
    event.preventDefault()
  })
  mainWindow.setTitle(`StreamingBot by Landminen Tester - V. ${app.getVersion()}`)

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
