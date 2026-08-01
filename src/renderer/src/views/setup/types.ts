export const SETUP_STEPS = [
  'welcome',
  'appearance',
  'connection',
  'channel',
  'features',
  'summary'
] as const

export type SetupStep = (typeof SETUP_STEPS)[number]
