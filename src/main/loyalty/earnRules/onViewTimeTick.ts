import { listEarnRules } from '../../db/repositories/loyalty.repo'
import { creditLoyalty } from '../loyaltyLedger'
import { getPresentUsers } from '../../twitch/chat/presenceTracker'
import { isStreamLive } from '../../stats/viewerCountPoller'
import { logger } from '../../logger'

let tickTimer: NodeJS.Timeout | null = null

function runTick(points: number): void {
  if (!isStreamLive()) return
  const users = getPresentUsers()
  for (const userLogin of users) {
    creditLoyalty(userLogin, points, 'view_time')
  }
  if (users.length > 0) {
    logger.info(`Loyalty: View-Time-Tick, +${points} für ${users.length} anwesende Chatter`)
  }
}

/** Startet den View-Time-Tick-Timer basierend auf der `view_time`-Earn-Rule (Intervall = cooldown_seconds). */
export function startViewTimeTicker(): void {
  stopViewTimeTicker()

  const rule = listEarnRules().find((r) => r.reason === 'view_time')
  if (!rule?.enabled || rule.cooldownSeconds <= 0) return

  tickTimer = setInterval(() => runTick(rule.points), rule.cooldownSeconds * 1000)
}

export function stopViewTimeTicker(): void {
  if (tickTimer) clearInterval(tickTimer)
  tickTimer = null
}
