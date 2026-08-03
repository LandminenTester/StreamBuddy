export type ActivityEventType =
  | 'follow'
  | 'sub'
  | 'resub'
  | 'gift_sub'
  | 'bits'
  | 'raid'
  | 'channel_points'

export interface ActivityEvent {
  id: number
  eventType: ActivityEventType
  twitchEventId: string | null
  actorLogin: string | null
  actorDisplayName: string | null
  targetLogin: string | null
  summary: string
  payload: Record<string, unknown> | null
  occurredAt: number
  createdAt: number
}

export interface ActivityEventInput {
  eventType: ActivityEventType
  twitchEventId?: string | null
  actorLogin?: string | null
  actorDisplayName?: string | null
  targetLogin?: string | null
  summary: string
  payload?: Record<string, unknown> | null
  occurredAt?: number
}

export interface ActivityListRequest {
  eventTypes?: ActivityEventType[]
  sinceMs?: number
  search?: string
  limit?: number
}
