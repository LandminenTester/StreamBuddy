import { defineStore } from 'pinia'
import { ref } from 'vue'
import type {
  LoyaltyEarnRule,
  LoyaltyGameInfo,
  LoyaltyLeaderboardEntry
} from '@shared/types/loyalty'

export const useLoyaltyStore = defineStore('loyalty', () => {
  const leaderboard = ref<LoyaltyLeaderboardEntry[]>([])
  const earnRules = ref<LoyaltyEarnRule[]>([])
  const games = ref<LoyaltyGameInfo[]>([])

  async function fetchLeaderboard(): Promise<void> {
    leaderboard.value = await window.api.invoke('loyalty:getLeaderboard', undefined)
  }

  async function fetchEarnRules(): Promise<void> {
    earnRules.value = await window.api.invoke('loyalty:listEarnRules', undefined)
  }

  async function updateEarnRule(rule: LoyaltyEarnRule): Promise<void> {
    earnRules.value = await window.api.invoke('loyalty:updateEarnRule', rule)
  }

  async function fetchGames(): Promise<void> {
    games.value = await window.api.invoke('loyalty:listGames', undefined)
  }

  async function setGameEnabled(gameId: string, enabled: boolean): Promise<void> {
    games.value = await window.api.invoke('loyalty:setGameEnabled', { gameId, enabled })
  }

  async function updateGameConfig(gameId: string, config: Record<string, unknown>): Promise<void> {
    games.value = await window.api.invoke('loyalty:updateGameConfig', { gameId, config })
  }

  return {
    leaderboard,
    earnRules,
    games,
    fetchLeaderboard,
    fetchEarnRules,
    updateEarnRule,
    fetchGames,
    setGameEnabled,
    updateGameConfig
  }
})
