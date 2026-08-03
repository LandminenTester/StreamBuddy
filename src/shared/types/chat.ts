export interface ChatConnectionStatus {
  connected: boolean
  channel: string | null
  lastError: string | null
}

export interface ChatMessageSegment {
  type: 'text' | 'emote'
  text: string
  url?: string
}

export interface ChatMessageBadge {
  id: string
  version: string
  title: string
  imageUrl: string | null
}

export interface ChatFeedMessage {
  id: string
  username: string
  displayName: string
  color: string | null
  message: string
  segments: ChatMessageSegment[]
  badges: ChatMessageBadge[]
  timestamp: number
}
