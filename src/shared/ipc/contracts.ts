import { IpcChannels } from './channels'
import type {
  AccentColor,
  AppLocale,
  AppMetadata,
  AppTheme,
  ChangelogEntry,
  SetupState,
  UpdateStatus
} from '../types/appInfo'
import type { Command, CommandInput } from '../types/command'
import type {
  AuthStatus,
  DeviceAuthPrompt,
  FeatureKey,
  FeatureScopeDefinition
} from '../types/auth'
import type { ChatConnectionStatus, ChatFeedMessage } from '../types/chat'
import type {
  AdMessageSettings,
  AdScheduleStatus,
  Automessage,
  AutomessageInput
} from '../types/automessage'
import type {
  ChannelPointReward,
  ChannelPointRewardInput,
  RedemptionLogEntry
} from '../types/channelPointReward'
import type { Poll, PollCreateInput, PollTemplate, PollTemplateInput } from '../types/poll'
import type {
  LoyaltyAccount,
  LoyaltyEarnRule,
  LoyaltyGameHistoryEntry,
  LoyaltyGameInfo,
  LoyaltyGameStats,
  LoyaltyGreetingSettings,
  LoyaltyLeaderboardEntry
} from '../types/loyalty'
import type { RouletteRoundResult } from '../types/roulette'
import type { ChatMessageStatsBucket, LiveStatsUpdate, ViewerCountSample } from '../types/stats'
import type {
  FollowerEntry,
  FollowerHistoryEntry,
  SyncResult,
  SyncStatus
} from '../types/followers'
import type { StreamSummary, StreamStats, ViewerSession } from '../types/viewers'
import type { CommandTracker, TrackerInput } from '../types/tracker'
import type { SettingsFileResult } from '../types/settings'
import type { CsvDelimiter, LoyaltyCsvMapping } from '../utils/loyaltyCsv'

/**
 * Request/Response-Typen pro IPC-Channel. Single-Source-of-Truth für Main- und
 * Renderer-Seite (siehe src/preload/index.ts und src/main/ipc/*.ipc.ts).
 * Wird pro Feature-Phase erweitert.
 */
export interface IpcContracts {
  [IpcChannels.app.getVersion]: { request: void; response: string }
  [IpcChannels.app.getMetadata]: { request: void; response: AppMetadata }
  [IpcChannels.app.getChangelog]: { request: void; response: ChangelogEntry[] }
  [IpcChannels.app.checkForUpdate]: { request: void; response: void }
  [IpcChannels.app.downloadUpdate]: { request: void; response: void }
  [IpcChannels.app.installUpdate]: { request: void; response: void }
  [IpcChannels.app.onUpdateStatus]: { request: void; response: UpdateStatus }
  [IpcChannels.app.getTheme]: { request: void; response: AppTheme }
  [IpcChannels.app.setTheme]: { request: { theme: AppTheme }; response: void }
  [IpcChannels.app.getAccent]: { request: void; response: AccentColor }
  [IpcChannels.app.setAccent]: { request: { accent: AccentColor }; response: void }
  [IpcChannels.app.getLocale]: { request: void; response: AppLocale }
  [IpcChannels.app.setLocale]: { request: { locale: AppLocale }; response: void }
  [IpcChannels.app.getSetupState]: { request: void; response: SetupState }
  [IpcChannels.app.completeSetup]: { request: { locale: AppLocale }; response: SetupState }
  [IpcChannels.app.resetSetup]: { request: void; response: SetupState }
  [IpcChannels.app.resetBotTexts]: { request: { locale: AppLocale }; response: void }
  [IpcChannels.app.exportSettings]: { request: void; response: SettingsFileResult | null }
  [IpcChannels.app.importSettings]: { request: void; response: SettingsFileResult | null }
  [IpcChannels.app.resetAll]: { request: void; response: SetupState }

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
  [IpcChannels.auth.getClientId]: { request: void; response: string | null }
  [IpcChannels.auth.setClientId]: { request: { clientId: string }; response: void }
  [IpcChannels.auth.startModOAuth]: { request: void; response: AuthStatus }
  [IpcChannels.auth.onModDeviceCodeReady]: { request: void; response: DeviceAuthPrompt }
  [IpcChannels.auth.disconnectMod]: { request: void; response: void }

  [IpcChannels.chat.getStatus]: { request: void; response: ChatConnectionStatus }
  [IpcChannels.chat.getTargetChannel]: { request: void; response: string | null }
  [IpcChannels.chat.setTargetChannel]: {
    request: { channel: string }
    response: ChatConnectionStatus
  }
  [IpcChannels.chat.onStatusChanged]: { request: void; response: ChatConnectionStatus }
  [IpcChannels.chat.getAutoConnect]: { request: void; response: boolean }
  [IpcChannels.chat.setAutoConnect]: { request: { enabled: boolean }; response: boolean }
  [IpcChannels.chat.connect]: { request: void; response: ChatConnectionStatus }
  [IpcChannels.chat.onMessage]: { request: void; response: ChatFeedMessage }

  [IpcChannels.automessages.list]: { request: void; response: Automessage[] }
  [IpcChannels.automessages.create]: { request: AutomessageInput; response: Automessage }
  [IpcChannels.automessages.update]: {
    request: { id: number; patch: Partial<AutomessageInput> }
    response: Automessage
  }
  [IpcChannels.automessages.delete]: { request: { id: number }; response: void }
  [IpcChannels.automessages.getAdMessageSettings]: { request: void; response: AdMessageSettings }
  [IpcChannels.automessages.setAdMessageSettings]: {
    request: AdMessageSettings
    response: void
  }
  [IpcChannels.automessages.getAdScheduleStatus]: {
    request: void
    response: AdScheduleStatus | null
  }

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
  [IpcChannels.polls.end]: {
    request: { id: number; winnerChoiceIndex?: number | null }
    response: Poll
  }
  [IpcChannels.polls.reset]: { request: { id: number }; response: Poll }
  [IpcChannels.polls.getActive]: { request: void; response: Poll | null }
  [IpcChannels.polls.onUpdate]: { request: void; response: Poll }

  [IpcChannels.pollTemplates.list]: { request: void; response: PollTemplate[] }
  [IpcChannels.pollTemplates.create]: { request: PollTemplateInput; response: PollTemplate }
  [IpcChannels.pollTemplates.update]: {
    request: { id: number; input: PollTemplateInput }
    response: PollTemplate
  }
  [IpcChannels.pollTemplates.delete]: { request: { id: number }; response: void }

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
  [IpcChannels.loyalty.manualAdjust]: {
    request: { userLogins: string[] | 'all'; amount: number }
    response: LoyaltyLeaderboardEntry[]
  }
  [IpcChannels.loyalty.updateAccount]: {
    request: { userLogin: string; balance: number }
    response: LoyaltyLeaderboardEntry[]
  }
  [IpcChannels.loyalty.selectImportCsv]: {
    request: void
    response: { fileName: string; content: string } | null
  }
  [IpcChannels.loyalty.importCsv]: {
    request: { content: string; delimiter: CsvDelimiter; mapping: LoyaltyCsvMapping }
    response: { importedCount: number; errors: string[] } | null
  }
  [IpcChannels.loyalty.exportCsv]: { request: void; response: { exportedCount: number } | null }
  [IpcChannels.loyalty.listBlacklist]: { request: void; response: LoyaltyAccount[] }
  [IpcChannels.loyalty.setBlacklisted]: {
    request: { userLogin: string; blacklisted: boolean }
    response: LoyaltyAccount[]
  }
  [IpcChannels.loyalty.renameGame]: {
    request: { gameId: string; displayName: string }
    response: LoyaltyGameInfo[]
  }
  [IpcChannels.loyalty.updateGameTriggers]: {
    request: { gameId: string; commandTriggers: Record<string, string> }
    response: LoyaltyGameInfo[]
  }
  [IpcChannels.loyalty.updateGameTexts]: {
    request: { gameId: string; texts: Record<string, string[]> }
    response: LoyaltyGameInfo[]
  }
  [IpcChannels.loyalty.listGameHistory]: {
    request: { gameId: string; limit?: number }
    response: LoyaltyGameHistoryEntry[]
  }
  [IpcChannels.loyalty.getGameStats]: {
    request: { gameId: string }
    response: LoyaltyGameStats
  }
  [IpcChannels.loyalty.listRouletteColors]: {
    request: { limit?: number }
    response: RouletteRoundResult[]
  }
  [IpcChannels.loyalty.getOfflineMessages]: { request: void; response: string[] }
  [IpcChannels.loyalty.setOfflineMessages]: { request: { messages: string[] }; response: string[] }
  [IpcChannels.loyalty.getEnabled]: { request: void; response: boolean }
  [IpcChannels.loyalty.setEnabled]: { request: { enabled: boolean }; response: boolean }
  [IpcChannels.loyalty.getPointName]: { request: void; response: string }
  [IpcChannels.loyalty.setPointName]: { request: { name: string }; response: string }
  [IpcChannels.loyalty.getGreetingSettings]: {
    request: void
    response: LoyaltyGreetingSettings
  }
  [IpcChannels.loyalty.setGreetingSettings]: {
    request: LoyaltyGreetingSettings
    response: LoyaltyGreetingSettings
  }

  [IpcChannels.trackers.list]: { request: void; response: CommandTracker[] }
  [IpcChannels.trackers.create]: { request: TrackerInput; response: CommandTracker }
  [IpcChannels.trackers.update]: {
    request: { id: number; patch: Partial<TrackerInput> }
    response: CommandTracker
  }
  [IpcChannels.trackers.delete]: { request: { id: number }; response: void }
  [IpcChannels.trackers.adjust]: { request: { id: number; delta: number }; response: CommandTracker }
  [IpcChannels.trackers.setTextValue]: {
    request: { id: number; value: string }
    response: CommandTracker
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

  [IpcChannels.followers.getAll]: { request: void; response: FollowerEntry[] }
  [IpcChannels.followers.getHistory]: {
    request: { eventType?: 'follow' | 'unfollow'; sinceMs?: number }
    response: FollowerHistoryEntry[]
  }
  [IpcChannels.followers.syncNow]: { request: void; response: SyncResult }
  [IpcChannels.followers.getSyncStatus]: { request: void; response: SyncStatus }
  [IpcChannels.followers.onSyncComplete]: { request: void; response: SyncResult }

  [IpcChannels.viewers.getPresent]: { request: void; response: string[] }
  [IpcChannels.viewers.getStreams]: { request: { limit?: number; offset?: number }; response: StreamSummary[] }
  [IpcChannels.viewers.getStreamViewers]: { request: { streamId: string }; response: ViewerSession[] }
  [IpcChannels.viewers.getStreamStats]: { request: { streamId: string }; response: StreamStats }
  [IpcChannels.viewers.onPresenceUpdate]: { request: void; response: string[] }
}
