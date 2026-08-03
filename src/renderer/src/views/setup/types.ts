export const SETUP_STEPS = [
  'welcome',
  'appearance',
  'connection',
  'mod_account',
  'channel',
  'features',
  'bot_blacklist',
  'summary'
] as const

export type SetupStep = (typeof SETUP_STEPS)[number]
