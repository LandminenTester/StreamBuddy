import type { useLoyaltyStore } from '@renderer/stores/loyalty.store'
import type { LoyaltyEarnRule } from '@shared/types/loyalty'
import type { AccountEditFormState } from './types'

type LoyaltyStore = ReturnType<typeof useLoyaltyStore>

export async function saveEarnRule(store: LoyaltyStore, rule: LoyaltyEarnRule): Promise<void> {
  await store.updateEarnRule(rule)
}

export async function applyPointsToSelection(
  store: LoyaltyStore,
  userLogins: string[],
  amount: number,
  direction: 'give' | 'remove'
): Promise<void> {
  const signedAmount = direction === 'give' ? Math.abs(amount) : -Math.abs(amount)
  await store.manualAdjust(userLogins, signedAmount)
}

export async function applyPointsToAll(
  store: LoyaltyStore,
  amount: number,
  direction: 'give' | 'remove'
): Promise<void> {
  const signedAmount = direction === 'give' ? Math.abs(amount) : -Math.abs(amount)
  await store.manualAdjust('all', signedAmount)
}

export async function submitAccountEdit(
  store: LoyaltyStore,
  form: AccountEditFormState
): Promise<void> {
  await store.updateAccount(form.userLogin, form.balance)
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
