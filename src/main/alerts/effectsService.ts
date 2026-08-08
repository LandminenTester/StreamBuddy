import { getEffectById } from '../db/repositories/effects.repo'
import { broadcastTrigger } from './effectsServer'

export function triggerEffect(id: number): void {
  getEffectById(id)
  broadcastTrigger(id)
}
