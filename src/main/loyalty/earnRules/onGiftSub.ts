import { listEarnRules } from '../../db/repositories/loyalty.repo'
import { creditLoyalty } from '../loyaltyLedger'
import { isStreamLive } from '../../stats/viewerCountPoller'
import { logger } from '../../logger'

interface GiftSubEvent {
  user_login: string | null
  is_anonymous: boolean
  total: number
}

export function handleGiftSubEarnEvent(event: Record<string, unknown>): void {
  const payload = event as unknown as GiftSubEvent
  if (payload.is_anonymous || !payload.user_login || !isStreamLive()) return

  const rule = listEarnRules().find((r) => r.reason === 'gift_sub')
  if (!rule?.enabled) return

  const amount = rule.points * payload.total
  creditLoyalty(payload.user_login, amount, 'gift_sub')
  logger.info(`Loyalty: +${amount} für ${payload.total} Gifted Sub(s) von ${payload.user_login}`)
}
