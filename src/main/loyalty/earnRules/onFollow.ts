import { listEarnRules } from '../../db/repositories/loyalty.repo'
import { creditLoyalty } from '../loyaltyLedger'
import { logger } from '../../logger'

interface FollowEvent {
  user_login: string
}

export function handleFollowEarnEvent(event: Record<string, unknown>): void {
  const payload = event as unknown as FollowEvent
  const rule = listEarnRules().find((r) => r.reason === 'follow')
  if (!rule?.enabled) return

  creditLoyalty(payload.user_login, rule.points, 'follow')
  logger.info(`Loyalty: +${rule.points} für Follow von ${payload.user_login}`)
}
