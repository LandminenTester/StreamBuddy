import { defineStore } from 'pinia'
import { ref } from 'vue'
import type {
  LoyaltyAccount,
  LoyaltyDuelMatch,
  LoyaltyEarnRule,
  LoyaltyGameHistoryEntry,
  LoyaltyGameInfo,
  LoyaltyGameStats,
  LoyaltyGreetingSettings,
  LoyaltyLeaderboardEntry
} from '@shared/types/loyalty'
import type { RouletteRoundResult } from '@shared/types/roulette'
import type { CsvDelimiter, LoyaltyCsvMapping } from '@shared/utils/loyaltyCsv'
import { translateError } from '@renderer/i18n/errors'

export const useLoyaltyStore = defineStore('loyalty', () => {
  const leaderboard = ref<LoyaltyLeaderboardEntry[]>([])
  const earnRules = ref<LoyaltyEarnRule[]>([])
  const games = ref<LoyaltyGameInfo[]>([])
  const blacklist = ref<LoyaltyAccount[]>([])
  const error = ref<string | null>(null)
  const gameHistory = ref<LoyaltyGameHistoryEntry[]>([])
  const gameStats = ref<LoyaltyGameStats | null>(null)
  const duelMatches = ref<LoyaltyDuelMatch[]>([])
  const rouletteColors = ref<RouletteRoundResult[]>([])
  const offlineMessages = ref<string[]>([])
  const greetingSettings = ref<LoyaltyGreetingSettings>({
    greetNewViewers: false,
    newViewerTexts: [],
    personalGreetings: []
  })
  const isEnabled = ref(true)
  const pointName = ref('')

  async function fetchLeaderboard(): Promise<void> {
    leaderboard.value = await window.api.invoke('loyalty:getLeaderboard', undefined)
  }

  async function fetchEarnRules(): Promise<void> {
    earnRules.value = await window.api.invoke('loyalty:listEarnRules', undefined)
  }

  async function updateEarnRule(rule: LoyaltyEarnRule): Promise<void> {
    error.value = null
    try {
      earnRules.value = await window.api.invoke('loyalty:updateEarnRule', {
        reason: rule.reason,
        points: Number(rule.points),
        enabled: Boolean(rule.enabled),
        cooldownSeconds: Number(rule.cooldownSeconds)
      })
    } catch (err) {
      error.value = translateError(err)
      throw err
    }
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
      error.value = translateError(err)
    }
  }

  async function updateAccount(userLogin: string, balance: number): Promise<void> {
    error.value = null
    try {
      leaderboard.value = await window.api.invoke('loyalty:updateAccount', { userLogin, balance })
    } catch (err) {
      error.value = translateError(err)
    }
  }

  async function selectImportCsv(): Promise<{ fileName: string; content: string } | null> {
    error.value = null
    return window.api.invoke('loyalty:selectImportCsv', undefined)
  }

  async function importCsv(input: {
    content: string
    delimiter: CsvDelimiter
    mapping: LoyaltyCsvMapping
  }): Promise<{ importedCount: number; errors: string[] } | null> {
    error.value = null
    try {
      const result = await window.api.invoke('loyalty:importCsv', {
        content: String(input.content),
        delimiter: input.delimiter,
        mapping: {
          userLoginColumn: Number(input.mapping.userLoginColumn),
          balanceColumn: Number(input.mapping.balanceColumn)
        }
      })
      if (result) await fetchLeaderboard()
      return result
    } catch (err) {
      error.value = translateError(err)
      return null
    }
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

  async function updateGameTriggers(
    gameId: string,
    commandTriggers: Record<string, string>
  ): Promise<void> {
    games.value = await window.api.invoke('loyalty:updateGameTriggers', { gameId, commandTriggers })
  }

  async function updateGameTexts(gameId: string, texts: Record<string, string[]>): Promise<void> {
    games.value = await window.api.invoke('loyalty:updateGameTexts', { gameId, texts })
  }

  async function fetchGameHistory(gameId: string, limit?: number): Promise<void> {
    gameHistory.value = await window.api.invoke('loyalty:listGameHistory', { gameId, limit })
  }

  async function fetchDuelMatches(limit?: number): Promise<void> {
    duelMatches.value = await window.api.invoke('loyalty:listDuelMatches', { limit })
  }

  async function fetchGameStats(gameId: string): Promise<void> {
    gameStats.value = await window.api.invoke('loyalty:getGameStats', { gameId })
  }

  async function fetchRouletteColors(limit?: number): Promise<void> {
    rouletteColors.value = await window.api.invoke('loyalty:listRouletteColors', { limit })
  }

  async function fetchOfflineMessages(): Promise<void> {
    offlineMessages.value = await window.api.invoke('loyalty:getOfflineMessages', undefined)
  }

  async function setOfflineMessages(messages: string[]): Promise<void> {
    offlineMessages.value = await window.api.invoke('loyalty:setOfflineMessages', { messages })
  }

  async function fetchGreetingSettings(): Promise<void> {
    greetingSettings.value = await window.api.invoke('loyalty:getGreetingSettings', undefined)
  }

  async function setGreetingSettings(settings: LoyaltyGreetingSettings): Promise<void> {
    greetingSettings.value = await window.api.invoke('loyalty:setGreetingSettings', {
      greetNewViewers: Boolean(settings.greetNewViewers),
      newViewerTexts: [...settings.newViewerTexts],
      personalGreetings: settings.personalGreetings.map((rule) => ({
        id: rule.id,
        userLogin: rule.userLogin,
        enabled: Boolean(rule.enabled),
        texts: [...rule.texts]
      }))
    })
  }

  async function fetchSettings(): Promise<void> {
    isEnabled.value = await window.api.invoke('loyalty:getEnabled', undefined)
    pointName.value = await window.api.invoke('loyalty:getPointName', undefined)
  }

  async function setEnabled(enabled: boolean): Promise<void> {
    isEnabled.value = await window.api.invoke('loyalty:setEnabled', { enabled })
  }

  async function savePointName(name: string): Promise<void> {
    pointName.value = await window.api.invoke('loyalty:setPointName', { name })
  }

  return {
    leaderboard,
    earnRules,
    games,
    blacklist,
    error,
    gameHistory,
    gameStats,
    duelMatches,
    rouletteColors,
    offlineMessages,
    greetingSettings,
    isEnabled,
    pointName,
    fetchLeaderboard,
    fetchEarnRules,
    updateEarnRule,
    fetchGames,
    setGameEnabled,
    updateGameConfig,
    renameGame,
    manualAdjust,
    updateAccount,
    selectImportCsv,
    importCsv,
    exportCsv,
    fetchBlacklist,
    setBlacklisted,
    updateGameTriggers,
    updateGameTexts,
    fetchGameHistory,
    fetchDuelMatches,
    fetchGameStats,
    fetchRouletteColors,
    fetchOfflineMessages,
    setOfflineMessages,
    fetchGreetingSettings,
    setGreetingSettings,
    fetchSettings,
    setEnabled,
    savePointName
  }
})
