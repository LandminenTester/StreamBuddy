import { getSetting, setSetting } from '../db/repositories/appSettings.repo'

const KEY_ENABLED = 'loyalty_enabled'
const KEY_POINT_NAME = 'loyalty_point_name'

export function getLoyaltyEnabled(): boolean {
  return (getSetting(KEY_ENABLED) ?? '1') !== '0'
}

export function setLoyaltyEnabled(enabled: boolean): void {
  setSetting(KEY_ENABLED, enabled ? '1' : '0')
}

export function getLoyaltyPointName(): string {
  return getSetting(KEY_POINT_NAME) ?? ''
}

export function setLoyaltyPointName(name: string): void {
  setSetting(KEY_POINT_NAME, name.trim())
}
