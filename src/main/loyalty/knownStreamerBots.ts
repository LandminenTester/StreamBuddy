export const KNOWN_STREAMER_BOTS = [
  'ankhbot',
  'blerp',
  'botisimo',
  'botrixoficial',
  'commanderroot',
  'creatisbot',
  'deepbot',
  'fossabot',
  'kofistreambot',
  'mixitupapp',
  'moobot',
  'nightbot',
  'own3d',
  'phantombot',
  'pokemoncommunitygame',
  'pretzelrocks',
  'sery_bot',
  'soundalerts',
  'streamavatars',
  'streamelements',
  'streamlabs',
  'streamlabscharity',
  'streamschemer',
  'tipeeestreambot',
  'wizebot'
] as const

export function cleanBotLogin(login: string): string {
  return login.trim().replace(/^@/, '').toLowerCase()
}

export function isKnownStreamerBot(login: string): boolean {
  return KNOWN_STREAMER_BOTS.includes(cleanBotLogin(login) as (typeof KNOWN_STREAMER_BOTS)[number])
}
