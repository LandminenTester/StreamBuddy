import { defineStore } from 'pinia'
import { ref } from 'vue'
import type {
  LoyaltyAccount,
  LoyaltyEarnRule,
  LoyaltyGameInfo,
  LoyaltyLeaderboardEntry
} from '@shared/types/loyalty'

export const useLoyaltyStore = defineStore('loyalty', () => {
  const leaderboard = ref<LoyaltyLeaderboardEntry[]>([])
  const earnRules = ref<LoyaltyEarnRule[]>([])
  const games = ref<LoyaltyGameInfo[]>([])
  const blacklist = ref<LoyaltyAccount[]>([])
  const error = ref<string | null>(null)

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

  async function manualAdjust(userLogins: string[] | 'all', amount: number): Promise<void> {
    error.value = null
    try {
      leaderboard.value = await window.api.invoke('loyalty:manualAdjust', { userLogins, amount })
    } catch (err) {
      error.value = (err as Error).message
    }
  }

  async function updateAccount(userLogin: string, balance: number): Promise<void> {
    error.value = null
    try {
      leaderboard.value = await window.api.invoke('loyalty:updateAccount', { userLogin, balance })
    } catch (err) {
      error.value = (err as Error).message
    }
  }

  async function importCsv(): Promise<{ importedCount: number; errors: string[] } | null> {
    error.value = null
    const result = await window.api.invoke('loyalty:importCsv', undefined)
    if (result) await fetchLeaderboard()
    return result
  }

  async function exportCsv(): Promise<{ exportedCount: number } | null> {
    error.value = null
    return window.api.invoke('loyalty:exportCsv', undefined)
  }

  async function renameGame(gameId: string, displayName: string): Promise<void> {
    games.value = await window.api.invoke('loyalty:renameGame', { gameId, displayName })
  }

  async function fetchBlacklist(): Promise<void> {
    blacklist.value = await window.api.invoke('loyalty:listBlacklist', undefined)
  }

  async function setBlacklisted(userLogin: string, blacklisted: boolean): Promise<void> {
    blacklist.value = await window.api.invoke('loyalty:setBlacklisted', {
      userLogin,
      blacklisted
    })
    // Ein neu geblacklisteter Nutzer muss sofort aus der Rangliste verschwinden,
    // ein entfernter taucht dort erst nach dem nächsten Fetch wieder auf.
    await fetchLeaderboard()
  }

  return {
    leaderboard,
    earnRules,
    games,
    blacklist,
    error,
    fetchLeaderboard,
    fetchEarnRules,
    updateEarnRule,
    fetchGames,
    setGameEnabled,
    updateGameConfig,
    renameGame,
    manualAdjust,
    updateAccount,
    importCsv,
    exportCsv,
    fetchBlacklist,
    setBlacklisted
  }
})
