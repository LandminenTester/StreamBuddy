export interface ChatMessageStatsBucket {
  bucketStart: number
  messageCount: number
  uniqueChatters: number
}

export interface ViewerCountSample {
  sampledAt: number
  viewerCount: number
  streamId: string | null
}

export interface LiveStatsUpdate {
  currentViewerCount: number | null
  messagesLastHour: number
  isLive: boolean
}
