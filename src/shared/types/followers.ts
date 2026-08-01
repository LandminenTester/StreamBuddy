export interface FollowerEntry {
  id: number
  userId: string
  userLogin: string
  displayName: string | null
  followedAt: number
  isActive: boolean
  syncedAt: number
}

export interface FollowerHistoryEntry {
  id: number
  userId: string
  userLogin: string
  eventType: 'follow' | 'unfollow'
  eventAt: number
  followDurationSeconds: number | null
}

export interface SyncResult {
  totalCount: number
  newCount: number
  lostCount: number
  syncedAt: number
}

export interface SyncStatus {
  lastSyncedAt: number | null
  totalCount: number
  newCount: number
  lostCount: number
}
