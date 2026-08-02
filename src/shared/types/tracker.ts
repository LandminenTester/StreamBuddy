export interface CommandTracker {
  id: number
  label: string
  value: number
  createdAt: number
}

export type TrackerInput = {
  label: string
  value?: number
}

export type TrackerAction = 'increment' | 'decrement'
