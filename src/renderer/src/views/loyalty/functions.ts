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

export async function renameGame(
  store: LoyaltyStore,
  gameId: string,
  displayName: string
): Promise<void> {
  await store.renameGame(gameId, displayName)
}

export async function updateGameTrigger(
  store: LoyaltyStore,
  gameId: string,
  existingTriggers: Record<string, string>,
  commandKey: string,
  newTrigger: string
): Promise<void> {
  const trimmed = newTrigger.trim()
  if (!trimmed) return
  await store.updateGameTriggers(gameId, { ...existingTriggers, [commandKey]: trimmed })
}

export async function updateGameTextSlot(
  store: LoyaltyStore,
  gameId: string,
  existingTexts: Record<string, string[]>,
  slot: string,
  variantsInput: string
): Promise<void> {
  const variants = variantsInput
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
  await store.updateGameTexts(gameId, { ...existingTexts, [slot]: variants })
}

export async function selectGame(store: LoyaltyStore, gameId: string): Promise<void> {
  await Promise.all([
    store.fetchGameHistory(gameId),
    store.fetchGameStats(gameId),
    gameId === 'roulette' ? store.fetchRouletteColors() : Promise.resolve()
  ])
}

export async function saveOfflineMessages(
  store: LoyaltyStore,
  messagesInput: string
): Promise<void> {
  const messages = messagesInput
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
  await store.setOfflineMessages(messages)
}
