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
    installUpdate: 'app:installUpdate',
    onUpdateStatus: 'app:onUpdateStatus',
    getTheme: 'app:getTheme',
    setTheme: 'app:setTheme',
    getAccent: 'app:getAccent',
    setAccent: 'app:setAccent'
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
    setClientId: 'auth:setClientId'
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
    importCsv: 'loyalty:importCsv',
    exportCsv: 'loyalty:exportCsv',
    listBlacklist: 'loyalty:listBlacklist',
    setBlacklisted: 'loyalty:setBlacklisted',
    renameGame: 'loyalty:renameGame',
    updateGameTriggers: 'loyalty:updateGameTriggers',
    updateGameTexts: 'loyalty:updateGameTexts',
    listGameHistory: 'loyalty:listGameHistory',
    getGameStats: 'loyalty:getGameStats',
    listRouletteColors: 'loyalty:listRouletteColors',
    getOfflineMessages: 'loyalty:getOfflineMessages',
    setOfflineMessages: 'loyalty:setOfflineMessages'
  },
  stats: {
    getMessagesPerHour: 'stats:getMessagesPerHour',
    getViewerCountSeries: 'stats:getViewerCountSeries',
    onLiveUpdate: 'stats:onLiveUpdate'
  }
} as const
