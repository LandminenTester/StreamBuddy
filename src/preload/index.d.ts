import type { ElectronAPI } from '@electron-toolkit/preload'
import type { IpcContracts } from '@shared/ipc/contracts'

export interface RendererApi {
  invoke<C extends keyof IpcContracts>(
    channel: C,
    payload: IpcContracts[C]['request']
  ): Promise<IpcContracts[C]['response']>
  on<C extends keyof IpcContracts>(
    channel: C,
    callback: (payload: IpcContracts[C]['response']) => void
  ): () => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: RendererApi
  }
}
