import { listEarnRules } from '../../db/repositories/loyalty.repo'
import { creditLoyalty } from '../loyaltyLedger'
import { getLoyaltyEnabled } from '../loyaltySettings'
import { isStreamLive } from '../../stats/viewerCountPoller'
import { logger } from '../../logger'

interface SubscribeEvent {
  user_login: string
  is_gift: boolean
}

/** Reagiert auf `channel.subscribe`. Gifted Subs werden hier ausgeklammert -- die Gutschrift für den Schenkenden läuft über onGiftSub.ts. */
export function handleSubEarnEvent(event: Record<string, unknown>): void {
  const payload = event as unknown as SubscribeEvent
  if (payload.is_gift || !getLoyaltyEnabled() || !isStreamLive()) return

  const rule = listEarnRules().find((r) => r.reason === 'sub')
  if (!rule?.enabled) return

  creditLoyalty(payload.user_login, rule.points, 'sub')
  logger.info(`Loyalty: +${rule.points} für Sub von ${payload.user_login}`)
}
