export interface Effect {
  id: number
  name: string
  videoPath: string | null
  audioPath: string | null
  width: number
  height: number
  volume: number
  createdAt: number
}

export type EffectInput = Omit<Effect, 'id' | 'createdAt'>
