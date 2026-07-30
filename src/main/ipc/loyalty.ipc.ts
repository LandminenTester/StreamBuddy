import type { LoyaltyGameInfo } from '@shared/types/loyalty'
import { IpcChannels } from '@shared/ipc/channels'
import { handleTyped } from './handleTyped'
import {
  getLeaderboard,
  listEarnRules,
  listGameConfigs,
  upsertEarnRule,
  upsertGameConfig
} from '../db/repositories/loyalty.repo'
import { startViewTimeTicker } from '../loyalty/earnRules/onViewTimeTick'
import { getAllGames, getGameRuntimeConfig } from '../loyalty/games/gameRegistry'
import { getChatStatus } from '../twitch/chat/tmiClient'

function listGamesWithInfo(): LoyaltyGameInfo[] {
  const configs = listGameConfigs()
  return getAllGames().map((game) => {
    const stored = configs.find((c) => c.gameId === game.id)
    return {
      gameId: game.id,
      commandTrigger: game.commandTrigger,
      enabled: stored?.enabled ?? true,
      config: getGameRuntimeConfig(game.id)
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
}
