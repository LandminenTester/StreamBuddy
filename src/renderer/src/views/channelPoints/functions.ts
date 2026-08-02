import type { useChannelPointsStore } from '@renderer/stores/channelPoints.store'
import type { RewardFormState } from './types'

type ChannelPointsStore = ReturnType<typeof useChannelPointsStore>

export async function submitRewardForm(
  store: ChannelPointsStore,
  form: RewardFormState
): Promise<void> {
  const input = {
    title: form.title.trim(),
    cost: form.cost,
    prompt: form.prompt.trim() || null,
    isEnabled: form.isEnabled,
    autoFulfill: form.autoFulfill,
    actionType: form.actionType,
    actionPayload:
      form.actionType === 'chat_message'
        ? { message: form.actionMessage.trim() }
        : form.actionType === 'trigger_command' && form.actionCommandId !== null
          ? { commandId: form.actionCommandId }
          : form.actionType === 'loyalty_exchange'
            ? { loyaltyExchangeMode: form.loyaltyExchangeMode, loyaltyExchangeValue: form.loyaltyExchangeValue }
            : null,
    backgroundColor: form.backgroundColor
  }

  if (form.id === null) {
    await store.createReward(input)
  } else {
    await store.updateReward(form.id, input)
  }
}

export async function deleteRewardById(store: ChannelPointsStore, id: number): Promise<void> {
  await store.deleteReward(id)
}
