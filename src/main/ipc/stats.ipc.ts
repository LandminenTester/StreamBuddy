import { IpcChannels } from '@shared/ipc/channels'
import { handleTyped } from './handleTyped'
import { getMessagesPerHour, getViewerCountSeries } from '../db/repositories/stats.repo'

export function registerStatsIpc(): void {
  handleTyped(IpcChannels.stats.getMessagesPerHour, ({ sinceMs }) => getMessagesPerHour(sinceMs))
  handleTyped(IpcChannels.stats.getViewerCountSeries, ({ sinceMs }) =>
    getViewerCountSeries(sinceMs)
  )
}
