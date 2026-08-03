import { listEarnRules } from '../../db/repositories/loyalty.repo'
import { getSetting } from '../../db/repositories/appSettings.repo'
import { creditLoyalty } from '../loyaltyLedger'
import { getLoyaltyEnabled } from '../loyaltySettings'
import { getPresentUsers } from '../../twitch/chat/presenceTracker'
import { logger } from '../../logger'

let tickTimer: NodeJS.Timeout | null = null

function cleanLogin(login: string): string {
  return login.trim().replace(/^@|^#/, '').toLowerCase()
}

function runTick(points: number): void {
  if (!getLoyaltyEnabled()) return
  const users = new Set(getPresentUsers().map(cleanLogin))
  const targetChannel = getSetting('target_channel')
  if (targetChannel) users.add(cleanLogin(targetChannel))

  for (const userLogin of users) {
    creditLoyalty(userLogin, points, 'view_time')
  }
  if (users.size > 0) {
    logger.info(`Loyalty: View-Time-Tick, +${points} fuer ${users.size} anwesende Chatter`)
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
