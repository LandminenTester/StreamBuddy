import { IpcChannels } from '@shared/ipc/channels'
import { handleTyped } from './handleTyped'
import {
  listBlacklistedLogins,
  setGreetingBlacklisted
} from '../db/repositories/greetingBlacklist.repo'
import { KNOWN_STREAMER_BOTS } from '@shared/knownStreamerBots'

/** IPC-Handler für die von der Loyalty-Blacklist unabhängige Begrüßungs-Blacklist. */
export function registerGreetingsIpc(): void {
  handleTyped(IpcChannels.greetings.listBlacklist, () => listBlacklistedLogins())

  handleTyped(IpcChannels.greetings.setBlacklisted, ({ userLogin, blacklisted }) => {
    setGreetingBlacklisted(userLogin, blacklisted)
    return listBlacklistedLogins()
  })

  handleTyped(IpcChannels.greetings.listKnownBots, () => [...KNOWN_STREAMER_BOTS])

  handleTyped(IpcChannels.greetings.blacklistKnownBots, () => {
    for (const botLogin of KNOWN_STREAMER_BOTS) {
      setGreetingBlacklisted(botLogin, true)
    }
    return listBlacklistedLogins()
  })
}
