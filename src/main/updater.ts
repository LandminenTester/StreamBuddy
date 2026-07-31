import { app } from 'electron'
import { autoUpdater } from 'electron-updater'
import type { UpdateStatus } from '@shared/types/appInfo'
import { IpcChannels } from '@shared/ipc/channels'
import { getMainWindow } from './window'
import { logger } from './logger'

let currentStatus: UpdateStatus = { state: 'idle' }

function setStatus(status: UpdateStatus): void {
  currentStatus = status
  getMainWindow()?.webContents.send(IpcChannels.app.onUpdateStatus, status)
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

  autoUpdater.autoDownload = true
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
    setStatus({ state: 'error', message: error.message })
  })
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
  }
}

/** Beendet die App und startet den heruntergeladenen Installer -- nur nach explizitem Nutzerklick. */
export function installUpdate(): void {
  autoUpdater.quitAndInstall()
}
