import { recordActivityEvent } from '../../../activity/activityService'
import type { ActivityEventInput } from '@shared/types/activity'

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

function numberValue(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function payloadOf(event: Record<string, unknown>): Record<string, unknown> {
  return { ...event }
}

function actor(
  event: Record<string, unknown>,
  loginKey = 'user_login',
  displayNameKey = 'user_name'
): Pick<ActivityEventInput, 'actorLogin' | 'actorDisplayName'> {
  const login = stringValue(event[loginKey])
  const displayName = stringValue(event[displayNameKey]) ?? login
  return { actorLogin: login, actorDisplayName: displayName }
}

export function handleFollowActivityEvent(event: Record<string, unknown>): void {
  const actorInfo = actor(event)
  recordActivityEvent({
    eventType: 'follow',
    twitchEventId: stringValue(event.id),
    ...actorInfo,
    targetLogin: stringValue(event.broadcaster_user_login),
    summary: `${actorInfo.actorDisplayName ?? 'Ein Zuschauer'} folgt jetzt`,
    payload: payloadOf(event)
  })
}

export function handleSubActivityEvent(event: Record<string, unknown>): void {
  if (event.is_gift === true) return
  const actorInfo = actor(event)
  const tier = stringValue(event.tier)
  recordActivityEvent({
    eventType: 'sub',
    twitchEventId: stringValue(event.id),
    ...actorInfo,
    targetLogin: stringValue(event.broadcaster_user_login),
    summary: `${actorInfo.actorDisplayName ?? 'Ein Zuschauer'} subscribed${tier ? ` (${tier})` : ''}`,
    payload: payloadOf(event)
  })
}

export function handleGiftSubActivityEvent(event: Record<string, unknown>): void {
  const actorInfo = actor(event)
  const total = numberValue(event.total) ?? 1
  const displayName =
    event.is_anonymous === true ? 'Anonym' : (actorInfo.actorDisplayName ?? 'Ein Zuschauer')
  recordActivityEvent({
    eventType: 'gift_sub',
    twitchEventId: stringValue(event.id),
    ...actorInfo,
    targetLogin: stringValue(event.broadcaster_user_login),
    summary: `${displayName} verschenkt ${total} Sub${total === 1 ? '' : 's'}`,
    payload: payloadOf(event)
  })
}

export function handleResubActivityEvent(event: Record<string, unknown>): void {
  const actorInfo = actor(event)
  const cumulativeMonths = numberValue(event.cumulative_months)
  recordActivityEvent({
    eventType: 'resub',
    twitchEventId: stringValue(event.id),
    ...actorInfo,
    targetLogin: stringValue(event.broadcaster_user_login),
    summary: `${actorInfo.actorDisplayName ?? 'Ein Zuschauer'} resubscribed${
      cumulativeMonths ? ` (${cumulativeMonths} Monate)` : ''
    }`,
    payload: payloadOf(event)
  })
}

export function handleCheerActivityEvent(event: Record<string, unknown>): void {
  const actorInfo = actor(event)
  const bits = numberValue(event.bits) ?? 0
  const displayName =
    event.is_anonymous === true ? 'Anonym' : (actorInfo.actorDisplayName ?? 'Ein Zuschauer')
  recordActivityEvent({
    eventType: 'bits',
    twitchEventId: stringValue(event.id),
    ...actorInfo,
    targetLogin: stringValue(event.broadcaster_user_login),
    summary: `${displayName} cheert ${bits} Bits`,
    payload: payloadOf(event)
  })
}

export function handleRaidActivityEvent(event: Record<string, unknown>): void {
  const actorInfo = actor(event, 'from_broadcaster_user_login', 'from_broadcaster_user_name')
  const viewers = numberValue(event.viewers) ?? 0
  recordActivityEvent({
    eventType: 'raid',
    twitchEventId: stringValue(event.id),
    ...actorInfo,
    targetLogin: stringValue(event.to_broadcaster_user_login),
    summary: `${actorInfo.actorDisplayName ?? 'Ein Kanal'} raidet mit ${viewers} Zuschauer${
      viewers === 1 ? '' : 'n'
    }`,
    payload: payloadOf(event)
  })
}
