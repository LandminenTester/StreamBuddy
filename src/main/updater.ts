import { app } from 'electron'
import electronUpdater from 'electron-updater'
import type { UpdateStatus } from '@shared/types/appInfo'
import { IpcChannels } from '@shared/ipc/channels'
import { getMainWindow } from './window'
import { logger } from './logger'

// electron-updater ist ein CommonJS-Modul; unter ESM gibt es keinen benannten
// `autoUpdater`-Export, daher muss ueber den Default-Export destrukturiert werden.
const { autoUpdater } = electronUpdater

let currentStatus: UpdateStatus = { state: 'idle' }

function setStatus(status: UpdateStatus): void {
  currentStatus = status
  getMainWindow()?.webContents.send(IpcChannels.app.onUpdateStatus, status)
}

function getUpdateErrorMessage(error: Error): string {
  if (error.message.includes('latest.yml') && error.message.includes('404')) {
    return 'Das neueste Release ist schon angelegt, aber der Installer ist noch nicht fertig. Bitte in ein paar Minuten erneut pruefen.'
  }

  return error.message
}

export function getUpdateStatus(): UpdateStatus {
  return currentStatus
}

/**
 * Initialisiert electron-updater. Laedt automatisch im Hintergrund herunter, sobald ein
 * Update gefunden wird (unterbricht nichts), installiert aber NIEMALS automatisch -- der
 * Bot kann waehrend eines laufenden Streams aktiv sein, ein Zwangs-Neustart waere fatal.
 * quitAndInstall() wird ausschliesslich durch einen expliziten Nutzerklick ausgeloest
 * (siehe app.ipc.ts installUpdate-Handler).
 */
export function initUpdater(): void {
  if (!app.isPackaged) return

  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = false

  autoUpdater.on('checking-for-update', () => {
    setStatus({ state: 'checking' })
  })

  autoUpdater.on('update-available', (info) => {
    setStatus({ state: 'available', version: info.version })
  })

  autoUpdater.on('update-not-available', () => {
    setStatus({ state: 'not-available' })
  })

  autoUpdater.on('download-progress', (progress) => {
    setStatus({ state: 'downloading', percent: Math.round(progress.percent) })
  })

  autoUpdater.on('update-downloaded', (info) => {
    setStatus({ state: 'downloaded', version: info.version })
  })

  autoUpdater.on('error', (error) => {
    logger.error('Update-Check fehlgeschlagen', error)
    setStatus({ state: 'error', message: getUpdateErrorMessage(error) })
  })
}

export async function downloadUpdate(): Promise<void> {
  if (!app.isPackaged) return
  try {
    await autoUpdater.downloadUpdate()
  } catch (error) {
    logger.error('downloadUpdate() fehlgeschlagen', error)
  }
}

export async function checkForUpdate(): Promise<void> {
  if (!app.isPackaged) {
    setStatus({ state: 'error', message: 'Update-Check nur in der gepackten App verfuegbar.' })
    return
  }
  try {
    await autoUpdater.checkForUpdates()
  } catch (error) {
    logger.error('checkForUpdates() fehlgeschlagen', error)
    setStatus({ state: 'error', message: getUpdateErrorMessage(error as Error) })
  }
}

/**
 * Beendet die App und startet den heruntergeladenen Installer -- nur nach explizitem
 * Nutzerklick. isSilent=true unterdrueckt das klassische NSIS-Installer-Fenster komplett,
 * unabhaengig von der oneClick-Build-Einstellung (die nur die manuelle Erstinstallation
 * betrifft). isForceRunAfter=true startet die App danach automatisch neu.
 */
export function installUpdate(): void {
  autoUpdater.quitAndInstall(true, true)
}
