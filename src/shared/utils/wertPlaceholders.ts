import type { CommandTracker } from '../types/tracker'

export const WERT_PLACEHOLDER_PATTERN = /\{wert:([a-z0-9_-]+)\}/gi

export function getWertPlaceholderKey(label: string): string {
  const key = label
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ae/g, 'a')
    .replace(/oe/g, 'o')
    .replace(/ue/g, 'u')
    .replace(/ss/g, 's')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')

  return key || 'wert'
}

export function getWertPlaceholder(tracker: Pick<CommandTracker, 'label'>): string {
  return `{wert:${getWertPlaceholderKey(tracker.label)}}`
}

export function formatTrackerCurrentValue(tracker: CommandTracker): string {
  return tracker.type === 'text' ? (tracker.textValue ?? '') : String(tracker.value)
}

export function findTrackerByPlaceholderKey(
  trackers: CommandTracker[],
  rawKey: string
): CommandTracker | null {
  const numericId = Number(rawKey)
  if (Number.isInteger(numericId)) {
    return trackers.find((tracker) => tracker.id === numericId) ?? null
  }

  const key = rawKey.toLowerCase()
  return trackers.find((tracker) => getWertPlaceholderKey(tracker.label) === key) ?? null
}
