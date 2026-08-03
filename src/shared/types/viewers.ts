export interface StreamSummary {
  id: number
  streamId: string
  channelLogin: string
  startedAt: number
  endedAt: number | null
  peakViewerCount: number
  gameName: string | null
  streamTitle: string | null
  uniqueChatters: number
  durationSeconds: number | null
}

export interface ViewerSession {
  id: number
  streamId: string
  userLogin: string
  joinedAt: number
  leftAt: number | null
  durationSeconds: number | null
  games: string[]
}

export interface StreamStats {
  uniqueChatters: number
  avgDurationSeconds: number | null
  totalViewSeconds: number
  topChatters: { userLogin: string; durationSeconds: number }[]
}
