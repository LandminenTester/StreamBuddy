import { dialog } from 'electron'
import { readFile, writeFile } from 'fs/promises'
import type { LoyaltyGameInfo } from '@shared/types/loyalty'
import { IpcChannels } from '@shared/ipc/channels'
import { handleTyped } from './handleTyped'
import {
  getGameStats,
  getLeaderboard,
  getOrCreateAccount,
  listAllAccounts,
  listBlacklistedAccounts,
  listEarnRules,
  listGameConfigs,
  listTransactionsByGame,
  setAccountBlacklisted,
  upsertEarnRule,
  upsertGameConfig
} from '../db/repositories/loyalty.repo'
import { listRecentRouletteColors } from '../db/repositories/rouletteRounds.repo'
import { getMessageSet, setMessageSet } from '../db/repositories/botMessages.repo'
import { startViewTimeTicker } from '../loyalty/earnRules/onViewTimeTick'
import {
  getAllGames,
  getGameRuntimeConfig,
  resolveCommandTrigger
} from '../loyalty/games/gameRegistry'
import { applyManualAdjustment, setAccountBalance } from '../loyalty/loyaltyLedger'
import { LOYALTY_OFFLINE_MESSAGE_KEY } from '../loyalty/offlineMessages'
import { parseLoyaltyCsv, serializeLoyaltyCsv } from '../loyalty/csv'
import { getChatStatus } from '../twitch/chat/tmiClient'
import { getMainWindow } from '../window'
import { logger } from '../logger'

function listGamesWithInfo(): LoyaltyGameInfo[] {
  const configs = listGameConfigs()
  return getAllGames().map((game) => {
    const stored = configs.find((c) => c.gameId === game.id)
    return {
      gameId: game.id,
      enabled: stored?.enabled ?? true,
      config: getGameRuntimeConfig(game.id),
      displayName: stored?.displayName ?? null,
      commandTriggers: stored?.commandTriggers ?? {},
      texts: stored?.texts ?? {},
      defaultTexts: game.defaultTexts ?? {},
      commands: game.commands.map((command) => ({
        key: command.key,
        defaultTrigger: command.defaultTrigger,
        trigger: resolveCommandTrigger(game.id, command)
      }))
    }
  })
}

export function registerLoyaltyIpc(): void {
  handleTyped(IpcChannels.loyalty.getLeaderboard, () => getLeaderboard())

  handleTyped(IpcChannels.loyalty.listEarnRules, () => listEarnRules())

  handleTyped(IpcChannels.loyalty.updateEarnRule, (rule) => {
    upsertEarnRule(rule)
    if (rule.reason === 'view_time' && getChatStatus().connected) {
      startViewTimeTicker()
    }
    return listEarnRules()
  })

  handleTyped(IpcChannels.loyalty.listGames, () => listGamesWithInfo())

  handleTyped(IpcChannels.loyalty.setGameEnabled, ({ gameId, enabled }) => {
    const config = getGameRuntimeConfig(gameId)
    upsertGameConfig(gameId, enabled, config)
    return listGamesWithInfo()
  })

  handleTyped(IpcChannels.loyalty.updateGameConfig, ({ gameId, config }) => {
    const existingEnabled = listGameConfigs().find((c) => c.gameId === gameId)?.enabled ?? true
    upsertGameConfig(gameId, existingEnabled, config)
    return listGamesWithInfo()
  })

  handleTyped(IpcChannels.loyalty.renameGame, ({ gameId, displayName }) => {
    const existing = listGameConfigs().find((c) => c.gameId === gameId)
    const config = existing?.config ?? getGameRuntimeConfig(gameId)
    upsertGameConfig(gameId, existing?.enabled ?? true, config, displayName.trim() || null)
    return listGamesWithInfo()
  })

  handleTyped(IpcChannels.loyalty.updateGameTriggers, ({ gameId, commandTriggers }) => {
    const existing = listGameConfigs().find((c) => c.gameId === gameId)
    const config = existing?.config ?? getGameRuntimeConfig(gameId)
    upsertGameConfig(
      gameId,
      existing?.enabled ?? true,
      config,
      existing?.displayName,
      commandTriggers
    )
    return listGamesWithInfo()
  })

  handleTyped(IpcChannels.loyalty.updateGameTexts, ({ gameId, texts }) => {
    const existing = listGameConfigs().find((c) => c.gameId === gameId)
    const config = existing?.config ?? getGameRuntimeConfig(gameId)
    upsertGameConfig(
      gameId,
      existing?.enabled ?? true,
      config,
      existing?.displayName,
      existing?.commandTriggers,
      texts
    )
    return listGamesWithInfo()
  })

  handleTyped(IpcChannels.loyalty.manualAdjust, ({ userLogins, amount }) => {
    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount === 0) {
      throw new Error('Betrag muss eine Zahl ungleich 0 sein')
    }
    if (userLogins !== 'all' && userLogins.length === 0) {
      throw new Error('Keine Nutzer ausgewählt')
    }
    applyManualAdjustment(userLogins, amount)
    return getLeaderboard()
  })

  handleTyped(IpcChannels.loyalty.updateAccount, ({ userLogin, balance }) => {
    if (typeof balance !== 'number' || !Number.isFinite(balance) || balance < 0) {
      throw new Error('Kontostand muss eine Zahl >= 0 sein')
    }
    setAccountBalance(userLogin, balance)
    return getLeaderboard()
  })

  handleTyped(IpcChannels.loyalty.importCsv, async () => {
    const window = getMainWindow()
    const result = window
      ? await dialog.showOpenDialog(window, {
          title: 'Loyalty-Rangliste per CSV importieren',
          filters: [{ name: 'CSV', extensions: ['csv'] }],
          properties: ['openFile']
        })
      : await dialog.showOpenDialog({
          title: 'Loyalty-Rangliste per CSV importieren',
          filters: [{ name: 'CSV', extensions: ['csv'] }],
          properties: ['openFile']
        })

    if (result.canceled || result.filePaths.length === 0) return null

    const content = await readFile(result.filePaths[0], 'utf-8')
    const { rows, errors } = parseLoyaltyCsv(content)

    let importedCount = 0
    for (const row of rows) {
      try {
        setAccountBalance(row.userLogin, row.balance)
        importedCount++
      } catch (error) {
        logger.error(`CSV-Import: Konnte Konto "${row.userLogin}" nicht setzen`, error)
        errors.push(`${row.userLogin}: ${(error as Error).message}`)
      }
    }

    return { importedCount, errors }
  })

  handleTyped(IpcChannels.loyalty.exportCsv, async () => {
    const window = getMainWindow()
    const result = window
      ? await dialog.showSaveDialog(window, {
          title: 'Loyalty-Rangliste als CSV exportieren',
          defaultPath: 'loyalty-rangliste.csv',
          filters: [{ name: 'CSV', extensions: ['csv'] }]
        })
      : await dialog.showSaveDialog({
          title: 'Loyalty-Rangliste als CSV exportieren',
          defaultPath: 'loyalty-rangliste.csv',
          filters: [{ name: 'CSV', extensions: ['csv'] }]
        })

    if (result.canceled || !result.filePath) return null

    const accounts = listAllAccounts()
    await writeFile(result.filePath, serializeLoyaltyCsv(accounts), 'utf-8')

    return { exportedCount: accounts.length }
  })

  handleTyped(IpcChannels.loyalty.listBlacklist, () => listBlacklistedAccounts())

  handleTyped(IpcChannels.loyalty.setBlacklisted, ({ userLogin, blacklisted }) => {
    getOrCreateAccount(userLogin)
    setAccountBlacklisted(userLogin, blacklisted)
    return listBlacklistedAccounts()
  })

  handleTyped(IpcChannels.loyalty.listGameHistory, ({ gameId, limit }) =>
    listTransactionsByGame(gameId, limit ?? 50)
  )

  handleTyped(IpcChannels.loyalty.getGameStats, ({ gameId }) => getGameStats(gameId))

  handleTyped(IpcChannels.loyalty.listRouletteColors, ({ limit }) =>
    listRecentRouletteColors(limit ?? 20)
  )

  handleTyped(IpcChannels.loyalty.getOfflineMessages, () =>
    getMessageSet(LOYALTY_OFFLINE_MESSAGE_KEY)
  )

  handleTyped(IpcChannels.loyalty.setOfflineMessages, ({ messages }) => {
    setMessageSet(LOYALTY_OFFLINE_MESSAGE_KEY, messages)
    return getMessageSet(LOYALTY_OFFLINE_MESSAGE_KEY)
  })
}
