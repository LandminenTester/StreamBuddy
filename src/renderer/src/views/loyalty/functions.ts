import type { useLoyaltyStore } from '@renderer/stores/loyalty.store'
import type { LoyaltyEarnRule } from '@shared/types/loyalty'

type LoyaltyStore = ReturnType<typeof useLoyaltyStore>

export async function saveEarnRule(store: LoyaltyStore, rule: LoyaltyEarnRule): Promise<void> {
  await store.updateEarnRule(rule)
}

export async function toggleGame(
  store: LoyaltyStore,
  gameId: string,
  enabled: boolean
): Promise<void> {
  await store.setGameEnabled(gameId, enabled)
}

export async function saveGameConfig(
  store: LoyaltyStore,
  gameId: string,
  config: Record<string, unknown>
): Promise<void> {
  await store.updateGameConfig(gameId, config)
}
