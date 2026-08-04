import {
  openViewerSession,
  closeViewerSession,
  closeAllOpenSessions
} from '../../db/repositories/viewerSessions.repo'
import {
  upsertStream,
  endStream as dbEndStream,
  updateStreamPeakViewers,
  updateStreamGame,
  upsertGameSegment,
  endLatestGameSegment
} from '../../db/repositories/streams.repo'
import { getSetting } from '../../db/repositories/appSettings.repo'
import { deleteForStream as deleteGreetedUsersForStream } from '../../db/repositories/greetedUsers.repo'
import { getMainWindow } from '../../window'
import { IpcChannels } from '@shared/ipc/channels'
import { getPresentUsers } from '../chat/presenceTracker'
import { logger } from '../../logger'

let currentStreamId: string | null = null
let currentGame: string | null = null

function broadcastPresence(): void {
  getMainWindow()?.webContents.send(IpcChannels.viewers.onPresenceUpdate, getPresentUsers())
}

export function onUserJoined(userLogin: string): void {
  broadcastPresence()
  if (!currentStreamId) return
  const now = Math.floor(Date.now() / 1000)
  openViewerSession(currentStreamId, userLogin, now)
}

export function onUserLeft(userLogin: string): void {
  broadcastPresence()
  if (!currentStreamId) return
  const now = Math.floor(Date.now() / 1000)
  closeViewerSession(currentStreamId, userLogin, now)
}

export function startStream(
  streamId: string,
  gameName: string | null,
  streamTitle: string | null
): void {
  if (currentStreamId === streamId) return

  currentStreamId = streamId
  currentGame = gameName

  const channelLogin = getSetting('target_channel') ?? 'unknown'
  const now = Math.floor(Date.now() / 1000)

  upsertStream(streamId, channelLogin, now, gameName, streamTitle)

  if (gameName) {
    upsertGameSegment(streamId, gameName, now)
  }

  logger.info(`Stream-Tracking gestartet: ${streamId} (${gameName ?? 'kein Spiel'})`)
}

export function updateGame(gameName: string | null): void {
  if (!currentStreamId || gameName === currentGame) return

  const now = Math.floor(Date.now() / 1000)
  endLatestGameSegment(currentStreamId, now)
  currentGame = gameName
  updateStreamGame(currentStreamId, gameName)

  if (gameName) {
    upsertGameSegment(currentStreamId, gameName, now)
  }
}

export function updatePeakViewers(viewerCount: number): void {
  if (!currentStreamId) return
  updateStreamPeakViewers(currentStreamId, viewerCount)
}

export function endStream(): void {
  if (!currentStreamId) return

  const now = Math.floor(Date.now() / 1000)
  closeAllOpenSessions(currentStreamId, now)
  endLatestGameSegment(currentStreamId, now)
  dbEndStream(currentStreamId, now)
  deleteGreetedUsersForStream(currentStreamId)

  logger.info(`Stream-Tracking beendet: ${currentStreamId}`)
  currentStreamId = null
  currentGame = null
  broadcastPresence()
}

export function getCurrentStreamId(): string | null {
  return currentStreamId
}
