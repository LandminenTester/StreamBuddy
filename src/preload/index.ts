import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { IpcContracts } from '@shared/ipc/contracts'

function invoke<C extends keyof IpcContracts>(
  channel: C,
  payload: IpcContracts[C]['request']
): Promise<IpcContracts[C]['response']> {
  return ipcRenderer.invoke(channel as string, payload)
}

function on<C extends keyof IpcContracts>(
  channel: C,
  callback: (payload: IpcContracts[C]['response']) => void
): () => void {
  const listener = (
    _event: Electron.IpcRendererEvent,
    payload: IpcContracts[C]['response']
  ): void => callback(payload)
  ipcRenderer.on(channel as string, listener)
  return () => ipcRenderer.removeListener(channel as string, listener)
}

const api = { invoke, on }

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-expect-error (nur im Fallback ohne contextIsolation, sollte in Prod nie greifen)
  window.electron = electronAPI
  // @ts-expect-error (siehe oben)
  window.api = api
}
