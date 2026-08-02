export type WertType = 'counter' | 'text'

export interface CommandTracker {
  id: number
  label: string
  type: WertType
  value: number
  textValue: string | null
  createdAt: number
}

export type TrackerInput = {
  label: string
  type?: WertType
  value?: number
  textValue?: string | null
}

export type TrackerAction = 'increment' | 'decrement'
