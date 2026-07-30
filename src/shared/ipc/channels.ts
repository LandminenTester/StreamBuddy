/**
 * Zentrale IPC-Channel-Namen. Wird pro Feature-Phase erweitert
 * (automessages, polls, channelPoints, loyalty, stats, auth).
 */
export const IpcChannels = {
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
    onStatusChanged: 'chat:onStatusChanged'
  },
  automessages: {
    list: 'automessages:list',
    create: 'automessages:create',
    update: 'automessages:update',
    delete: 'automessages:delete'
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
    exportCsv: 'loyalty:exportCsv'
  },
  stats: {
    getMessagesPerHour: 'stats:getMessagesPerHour',
    getViewerCountSeries: 'stats:getViewerCountSeries',
    onLiveUpdate: 'stats:onLiveUpdate'
  }
} as const
