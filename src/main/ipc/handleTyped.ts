import { ipcMain } from 'electron'
import type { IpcContracts } from '@shared/ipc/contracts'

/**
 * Typsicherer Wrapper um ipcMain.handle, erzwingt dieselbe Request/Response-Typisierung
 * wie preload/renderer aus src/shared/ipc/contracts.ts.
 */
export function handleTyped<C extends keyof IpcContracts>(
  channel: C,
  handler: (
    payload: IpcContracts[C]['request']
  ) => Promise<IpcContracts[C]['response']> | IpcContracts[C]['response']
): void {
  ipcMain.handle(channel as string, (_event, payload) => handler(payload))
}
