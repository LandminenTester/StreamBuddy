import type { SubTier } from '@shared/types/alertRule'
import { listAlertRules } from '../db/repositories/alertRules.repo'
import { buildInstance, findBestThresholdRule } from './alertRuleMatching'
import { enqueueAlert } from './alertManagerService'

export function handleFollowAlert(event: Record<string, unknown>): void {
  const rule = listAlertRules().find((r) => r.enabled && r.eventType === 'follow')
  if (!rule) return
  const user = String(event.user_login ?? event.user_name ?? '')
  enqueueAlert(buildInstance(rule, { user }))
}

function findSubRule() {
  return listAlertRules().find((r) => r.enabled && r.eventType === 'sub')
}

/**
 * Twitch unterscheidet Prime-Subs im `channel.subscribe`-Event nicht von regulären
 * Tier-1-Subs (kein `is_prime`-Feld) -- der 'prime'-Text kann daher nur per manuellem
 * "Testen" ausgelöst werden, nicht automatisch anhand echter Events.
 */
export function handleSubAlert(event: Record<string, unknown>): void {
  if (event.is_gift) return
  const rule = findSubRule()
  if (!rule) return
  const tier = String(event.tier ?? '1000')
  const resolvedTier: SubTier = tier === '1000' || tier === '2000' || tier === '3000' ? tier : '1000'
  const user = String(event.user_login ?? '')
  enqueueAlert(buildInstance(rule, { user }, { tier: resolvedTier }))
}

export function handleGiftSubAlert(event: Record<string, unknown>): void {
  const gifterLogin = event.user_login as string | null
  if (!gifterLogin) return // anonyme Gifts: kein Alert (analog onGiftSub.ts)

  const rule = findSubRule()
  if (!rule) return
  const total = Number(event.total ?? 0)
  enqueueAlert(buildInstance(rule, { user: gifterLogin, subcount: String(total) }, { giftAmount: total }))
}

export function handleRaidAlert(event: Record<string, unknown>): void {
  const viewers = Number(event.viewers ?? 0)
  const rule = findBestThresholdRule('raid', viewers)
  if (!rule) return
  const login = String(event.from_broadcaster_user_login ?? '')
  enqueueAlert(buildInstance(rule, { user: login, viewers: String(viewers) }))
}
