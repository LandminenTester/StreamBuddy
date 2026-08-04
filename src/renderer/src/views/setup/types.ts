export const SETUP_STEPS = [
  'welcome',
  'appearance',
  'connection',
  'mod_account',
  'channel',
  'features',
  'bot_blacklist',
  'shoutout',
  'summary'
] as const

export type SetupStep = (typeof SETUP_STEPS)[number]
