import { registerAppIpc } from './app.ipc'
import { registerCommandsIpc } from './commands.ipc'
import { registerAuthIpc } from './auth.ipc'
import { registerChatIpc } from './chat.ipc'
import { registerAutomessagesIpc } from './automessages.ipc'
import { registerChannelPointsIpc } from './channelPoints.ipc'
import { registerPollsIpc } from './polls.ipc'
import { registerPollTemplatesIpc } from './pollTemplates.ipc'
import { registerLoyaltyIpc } from './loyalty.ipc'
import { registerStatsIpc } from './stats.ipc'
import { registerFollowersIpc } from './followers.ipc'
import { registerViewersIpc } from './viewers.ipc'
import { registerTrackersIpc } from './trackers.ipc'

/**
 * Zentrale Registrierungsstelle für alle IPC-Handler.
 * Jedes Feature-Modul (commands, automessages, polls, ...) bekommt eine eigene
 * *.ipc.ts Datei mit einer register()-Funktion, die hier aufgerufen wird.
 */
export function registerIpcHandlers(): void {
  registerAppIpc()
  registerCommandsIpc()
  registerAuthIpc()
  registerChatIpc()
  registerAutomessagesIpc()
  registerChannelPointsIpc()
  registerPollsIpc()
  registerPollTemplatesIpc()
  registerLoyaltyIpc()
  registerStatsIpc()
  registerFollowersIpc()
  registerViewersIpc()
  registerTrackersIpc()
}
