import { IpcChannels } from '@shared/ipc/channels'
import { handleTyped } from './handleTyped'
import { getPresentUsers } from '../twitch/chat/presenceTracker'
import { getStreams } from '../db/repositories/streams.repo'
import {
  getViewerSessionsByStream,
  getStreamStats
} from '../db/repositories/viewerSessions.repo'

export function registerViewersIpc(): void {
  handleTyped(IpcChannels.viewers.getPresent, () => getPresentUsers())

  handleTyped(IpcChannels.viewers.getStreams, ({ limit, offset }) =>
    getStreams(limit ?? 50, offset ?? 0)
  )

  handleTyped(IpcChannels.viewers.getStreamViewers, ({ streamId }) =>
    getViewerSessionsByStream(streamId)
  )

  handleTyped(IpcChannels.viewers.getStreamStats, ({ streamId }) =>
    getStreamStats(streamId)
  )
}
