import type { BuiltInCommandInfo } from '@shared/types/command'
import { IpcChannels } from '@shared/ipc/channels'
import { handleTyped } from './handleTyped'
import {
  createCommand,
  deleteCommand,
  listCommands,
  updateCommand
} from '../db/repositories/commands.repo'
import {
  isBuiltInCommandEnabled,
  setBuiltInCommandEnabled
} from '../twitch/chat/builtInCommands'
import { LOYALTY_COMMAND_TRIGGERS } from '../twitch/chat/loyaltyCommandTriggers'
import { getAllGames, resolveCommandTrigger } from '../loyalty/games/gameRegistry'
import { isGameTemporarilyUnavailable } from '@shared/temporarilyUnavailable'

/** Fixer, nicht umbenennbarer Trigger fuer den eingebauten Mod-Command (siehe commandRouter.ts). */
const BLACKLIST_MOD_TRIGGER = '!blacklist'

function listBuiltInCommands(): BuiltInCommandInfo[] {
  const loyaltyEntries: BuiltInCommandInfo[] = Object.entries(LOYALTY_COMMAND_TRIGGERS).map(
    ([key, triggers]) => ({
      key,
      triggers: [...triggers],
      scope: 'loyalty',
      enabled: isBuiltInCommandEnabled(key),
      temporarilyUnavailable: false
    })
  )

  const modEntry: BuiltInCommandInfo = {
    key: 'blacklistMod',
    triggers: [BLACKLIST_MOD_TRIGGER],
    scope: 'loyalty',
    enabled: isBuiltInCommandEnabled('blacklistMod'),
    temporarilyUnavailable: false
  }

  const gameEntries: BuiltInCommandInfo[] = getAllGames().flatMap((game) =>
    game.commands.map((command) => {
      const key = `${game.id}.${command.key}`
      return {
        key,
        triggers: [resolveCommandTrigger(game.id, command)],
        scope: 'game' as const,
        gameId: game.id,
        enabled: isBuiltInCommandEnabled(key),
        temporarilyUnavailable: isGameTemporarilyUnavailable(game.id)
      }
    })
  )

  return [...loyaltyEntries, modEntry, ...gameEntries]
}

export function registerCommandsIpc(): void {
  handleTyped(IpcChannels.commands.list, () => listCommands())
  handleTyped(IpcChannels.commands.create, (input) => createCommand(input))
  handleTyped(IpcChannels.commands.update, ({ id, patch }) => updateCommand(id, patch))
  handleTyped(IpcChannels.commands.delete, ({ id }) => {
    deleteCommand(id)
  })

  handleTyped(IpcChannels.commands.listBuiltIn, () => listBuiltInCommands())

  handleTyped(IpcChannels.commands.setBuiltInEnabled, ({ key, enabled }) => {
    setBuiltInCommandEnabled(key, enabled)
    return listBuiltInCommands()
  })
}
