import { IpcChannels } from '@shared/ipc/channels'
import { handleTyped } from './handleTyped'
import {
  getAllFollowers,
  getFollowerHistory,
  getLatestSyncStatus
} from '../db/repositories/followers.repo'
import { runFollowerSync } from '../twitch/followers/followerSync'

export function registerFollowersIpc(): void {
  handleTyped(IpcChannels.followers.getAll, () => getAllFollowers())

  handleTyped(IpcChannels.followers.getHistory, ({ eventType, sinceMs }) =>
    getFollowerHistory(eventType, sinceMs)
  )

  handleTyped(IpcChannels.followers.syncNow, async () => runFollowerSync())

  handleTyped(IpcChannels.followers.getSyncStatus, () => getLatestSyncStatus())
}
