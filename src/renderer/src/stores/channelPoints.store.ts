import { defineStore } from 'pinia'
import { ref } from 'vue'
import type {
  ChannelPointReward,
  ChannelPointRewardInput,
  RedemptionLogEntry
} from '@shared/types/channelPointReward'
import { translateError } from '@renderer/i18n/errors'

export const useChannelPointsStore = defineStore('channelPoints', () => {
  const rewards = ref<ChannelPointReward[]>([])
  const redemptions = ref<RedemptionLogEntry[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function fetchRewards(): Promise<void> {
    isLoading.value = true
    try {
      rewards.value = await window.api.invoke('channelPoints:list', undefined)
    } finally {
      isLoading.value = false
    }
  }

  async function fetchRedemptions(): Promise<void> {
    redemptions.value = await window.api.invoke('channelPoints:listRedemptions', undefined)
  }

  async function createReward(input: ChannelPointRewardInput): Promise<void> {
    error.value = null
    try {
      const created = await window.api.invoke('channelPoints:create', input)
      rewards.value.push(created)
    } catch (err) {
      error.value = translateError(err)
      throw err
    }
  }

  async function updateReward(id: number, patch: Partial<ChannelPointRewardInput>): Promise<void> {
    const updated = await window.api.invoke('channelPoints:update', { id, patch })
    const index = rewards.value.findIndex((r) => r.id === id)
    if (index !== -1) rewards.value[index] = updated
  }

  async function deleteReward(id: number): Promise<void> {
    await window.api.invoke('channelPoints:delete', { id })
    rewards.value = rewards.value.filter((r) => r.id !== id)
  }

  function subscribeToRedemptions(): () => void {
    return window.api.on('channelPoints:onRedemption', (entry) => {
      redemptions.value = [entry, ...redemptions.value].slice(0, 50)
    })
  }

  return {
    rewards,
    redemptions,
    isLoading,
    error,
    fetchRewards,
    fetchRedemptions,
    createReward,
    updateReward,
    deleteReward,
    subscribeToRedemptions
  }
})
