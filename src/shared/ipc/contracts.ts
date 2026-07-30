import { IpcChannels } from './channels'
import type { Command, CommandInput } from '../types/command'
import type {
  AuthStatus,
  DeviceAuthPrompt,
  FeatureKey,
  FeatureScopeDefinition
} from '../types/auth'
import type { ChatConnectionStatus } from '../types/chat'
import type { Automessage, AutomessageInput } from '../types/automessage'
import type {
  ChannelPointReward,
  ChannelPointRewardInput,
  RedemptionLogEntry
} from '../types/channelPointReward'
import type { Poll, PollCreateInput } from '../types/poll'
import type { LoyaltyEarnRule, LoyaltyGameInfo, LoyaltyLeaderboardEntry } from '../types/loyalty'
import type { ChatMessageStatsBucket, LiveStatsUpdate, ViewerCountSample } from '../types/stats'

/**
 * Request/Response-Typen pro IPC-Channel. Single-Source-of-Truth für Main- und
 * Renderer-Seite (siehe src/preload/index.ts und src/main/ipc/*.ipc.ts).
 * Wird pro Feature-Phase erweitert.
 */
export interface IpcContracts {
  [IpcChannels.commands.list]: { request: void; response: Command[] }
  [IpcChannels.commands.create]: { request: CommandInput; response: Command }
  [IpcChannels.commands.update]: {
    request: { id: number; patch: Partial<CommandInput> }
    response: Command
  }
  [IpcChannels.commands.delete]: { request: { id: number }; response: void }

  [IpcChannels.auth.startOAuth]: { request: void; response: AuthStatus }
  [IpcChannels.auth.getStatus]: { request: void; response: AuthStatus }
  [IpcChannels.auth.disconnect]: { request: void; response: void }
  [IpcChannels.auth.listFeatures]: { request: void; response: FeatureScopeDefinition[] }
  [IpcChannels.auth.setFeatureEnabled]: {
    request: { featureKey: FeatureKey; enabled: boolean }
    response: AuthStatus
  }
  [IpcChannels.auth.onStatusChanged]: { request: void; response: AuthStatus }
  [IpcChannels.auth.onDeviceCodeReady]: { request: void; response: DeviceAuthPrompt }

  [IpcChannels.chat.getStatus]: { request: void; response: ChatConnectionStatus }
  [IpcChannels.chat.getTargetChannel]: { request: void; response: string | null }
  [IpcChannels.chat.setTargetChannel]: {
    request: { channel: string }
    response: ChatConnectionStatus
  }
  [IpcChannels.chat.onStatusChanged]: { request: void; response: ChatConnectionStatus }

  [IpcChannels.automessages.list]: { request: void; response: Automessage[] }
  [IpcChannels.automessages.create]: { request: AutomessageInput; response: Automessage }
  [IpcChannels.automessages.update]: {
    request: { id: number; patch: Partial<AutomessageInput> }
    response: Automessage
  }
  [IpcChannels.automessages.delete]: { request: { id: number }; response: void }

  [IpcChannels.channelPoints.list]: { request: void; response: ChannelPointReward[] }
  [IpcChannels.channelPoints.create]: {
    request: ChannelPointRewardInput
    response: ChannelPointReward
  }
  [IpcChannels.channelPoints.update]: {
    request: { id: number; patch: Partial<ChannelPointRewardInput> }
    response: ChannelPointReward
  }
  [IpcChannels.channelPoints.delete]: { request: { id: number }; response: void }
  [IpcChannels.channelPoints.listRedemptions]: { request: void; response: RedemptionLogEntry[] }
  [IpcChannels.channelPoints.onRedemption]: { request: void; response: RedemptionLogEntry }

  [IpcChannels.polls.list]: { request: void; response: Poll[] }
  [IpcChannels.polls.create]: { request: PollCreateInput; response: Poll }
  [IpcChannels.polls.end]: { request: { id: number }; response: Poll }
  [IpcChannels.polls.getActive]: { request: void; response: Poll | null }
  [IpcChannels.polls.onUpdate]: { request: void; response: Poll }

  [IpcChannels.loyalty.getLeaderboard]: { request: void; response: LoyaltyLeaderboardEntry[] }
  [IpcChannels.loyalty.listEarnRules]: { request: void; response: LoyaltyEarnRule[] }
  [IpcChannels.loyalty.updateEarnRule]: { request: LoyaltyEarnRule; response: LoyaltyEarnRule[] }
  [IpcChannels.loyalty.listGames]: { request: void; response: LoyaltyGameInfo[] }
  [IpcChannels.loyalty.setGameEnabled]: {
    request: { gameId: string; enabled: boolean }
    response: LoyaltyGameInfo[]
  }
  [IpcChannels.loyalty.updateGameConfig]: {
    request: { gameId: string; config: Record<string, unknown> }
    response: LoyaltyGameInfo[]
  }

  [IpcChannels.stats.getMessagesPerHour]: {
    request: { sinceMs: number }
    response: ChatMessageStatsBucket[]
  }
  [IpcChannels.stats.getViewerCountSeries]: {
    request: { sinceMs: number }
    response: ViewerCountSample[]
  }
  [IpcChannels.stats.onLiveUpdate]: { request: void; response: LiveStatsUpdate }
}
