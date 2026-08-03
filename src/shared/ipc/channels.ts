/**
 * Zentrale IPC-Channel-Namen. Wird pro Feature-Phase erweitert
 * (automessages, polls, channelPoints, loyalty, stats, auth).
 */
export const IpcChannels = {
  app: {
    getVersion: 'app:getVersion',
    getMetadata: 'app:getMetadata',
    getChangelog: 'app:getChangelog',
    checkForUpdate: 'app:checkForUpdate',
    downloadUpdate: 'app:downloadUpdate',
    installUpdate: 'app:installUpdate',
    onUpdateStatus: 'app:onUpdateStatus',
    getTheme: 'app:getTheme',
    setTheme: 'app:setTheme',
    getAccent: 'app:getAccent',
    setAccent: 'app:setAccent',
    getLocale: 'app:getLocale',
    setLocale: 'app:setLocale',
    getSetupState: 'app:getSetupState',
    completeSetup: 'app:completeSetup',
    resetSetup: 'app:resetSetup',
    resetBotTexts: 'app:resetBotTexts',
    exportSettings: 'app:exportSettings',
    importSettings: 'app:importSettings',
    resetAll: 'app:resetAll'
  },
  commands: {
    list: 'commands:list',
    create: 'commands:create',
    update: 'commands:update',
    delete: 'commands:delete'
  },
  auth: {
    startOAuth: 'auth:startOAuth',
    getStatus: 'auth:getStatus',
    disconnect: 'auth:disconnect',
    listFeatures: 'auth:listFeatures',
    setFeatureEnabled: 'auth:setFeatureEnabled',
    onStatusChanged: 'auth:onStatusChanged',
    onDeviceCodeReady: 'auth:onDeviceCodeReady',
    getClientId: 'auth:getClientId',
    setClientId: 'auth:setClientId',
    startModOAuth: 'auth:startModOAuth',
    onModDeviceCodeReady: 'auth:onModDeviceCodeReady',
    disconnectMod: 'auth:disconnectMod'
  },
  chat: {
    getStatus: 'chat:getStatus',
    getTargetChannel: 'chat:getTargetChannel',
    setTargetChannel: 'chat:setTargetChannel',
    onStatusChanged: 'chat:onStatusChanged',
    getAutoConnect: 'chat:getAutoConnect',
    setAutoConnect: 'chat:setAutoConnect',
    connect: 'chat:connect',
    onMessage: 'chat:onMessage'
  },
  automessages: {
    list: 'automessages:list',
    create: 'automessages:create',
    update: 'automessages:update',
    delete: 'automessages:delete',
    getAdMessageSettings: 'automessages:getAdMessageSettings',
    setAdMessageSettings: 'automessages:setAdMessageSettings',
    getAdScheduleStatus: 'automessages:getAdScheduleStatus'
  },
  channelPoints: {
    list: 'channelPoints:list',
    create: 'channelPoints:create',
    update: 'channelPoints:update',
    delete: 'channelPoints:delete',
    listRedemptions: 'channelPoints:listRedemptions',
    onRedemption: 'channelPoints:onRedemption'
  },
  activity: {
    list: 'activity:list',
    clear: 'activity:clear',
    onEvent: 'activity:onEvent'
  },
  polls: {
    list: 'polls:list',
    create: 'polls:create',
    end: 'polls:end',
    reset: 'polls:reset',
    getActive: 'polls:getActive',
    onUpdate: 'polls:onUpdate'
  },
  pollTemplates: {
    list: 'pollTemplates:list',
    create: 'pollTemplates:create',
    update: 'pollTemplates:update',
    delete: 'pollTemplates:delete'
  },
  loyalty: {
    getLeaderboard: 'loyalty:getLeaderboard',
    listEarnRules: 'loyalty:listEarnRules',
    updateEarnRule: 'loyalty:updateEarnRule',
    listGames: 'loyalty:listGames',
    setGameEnabled: 'loyalty:setGameEnabled',
    updateGameConfig: 'loyalty:updateGameConfig',
    manualAdjust: 'loyalty:manualAdjust',
    updateAccount: 'loyalty:updateAccount',
    selectImportCsv: 'loyalty:selectImportCsv',
    importCsv: 'loyalty:importCsv',
    exportCsv: 'loyalty:exportCsv',
    listBlacklist: 'loyalty:listBlacklist',
    setBlacklisted: 'loyalty:setBlacklisted',
    renameGame: 'loyalty:renameGame',
    updateGameTriggers: 'loyalty:updateGameTriggers',
    updateGameTexts: 'loyalty:updateGameTexts',
    listGameHistory: 'loyalty:listGameHistory',
    listDuelMatches: 'loyalty:listDuelMatches',
    getGameStats: 'loyalty:getGameStats',
    listRouletteColors: 'loyalty:listRouletteColors',
    getOfflineMessages: 'loyalty:getOfflineMessages',
    setOfflineMessages: 'loyalty:setOfflineMessages',
    getEnabled: 'loyalty:getEnabled',
    setEnabled: 'loyalty:setEnabled',
    getPointName: 'loyalty:getPointName',
    setPointName: 'loyalty:setPointName',
    getGreetingSettings: 'loyalty:getGreetingSettings',
    setGreetingSettings: 'loyalty:setGreetingSettings'
  },
  trackers: {
    list: 'trackers:list',
    create: 'trackers:create',
    update: 'trackers:update',
    delete: 'trackers:delete',
    adjust: 'trackers:adjust',
    setTextValue: 'trackers:setTextValue'
  },
  stats: {
    getMessagesPerHour: 'stats:getMessagesPerHour',
    getViewerCountSeries: 'stats:getViewerCountSeries',
    onLiveUpdate: 'stats:onLiveUpdate'
  },
  followers: {
    getAll: 'followers:getAll',
    getHistory: 'followers:getHistory',
    syncNow: 'followers:syncNow',
    getSyncStatus: 'followers:getSyncStatus',
    onSyncComplete: 'followers:onSyncComplete'
  },
  viewers: {
    getPresent: 'viewers:getPresent',
    getStreams: 'viewers:getStreams',
    getStreamViewers: 'viewers:getStreamViewers',
    getStreamStats: 'viewers:getStreamStats',
    onPresenceUpdate: 'viewers:onPresenceUpdate'
  }
} as const
