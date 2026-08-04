import type { LoyaltyGreetingSettings, LoyaltyPersonalGreeting } from '@shared/types/loyalty'
import { isGreetingBlacklisted } from '../db/repositories/greetingBlacklist.repo'
import { getSetting, setSetting } from '../db/repositories/appSettings.repo'
import { markGreeted, listGreetedLogins } from '../db/repositories/greetedUsers.repo'
import { getActiveChatClient } from '../twitch/chat/chatClientAccessor'
import { getPresentUsers } from '../twitch/chat/presenceTracker'
import { getCurrentStreamId } from '../twitch/viewers/viewerSessionTracker'
import { resolveTextPlaceholders } from './games/gameRegistry'
import { logger } from '../logger'
import { isKnownStreamerBot } from '@shared/knownStreamerBots'

const GREETING_SETTINGS_KEY = 'loyalty_greetings'

const DEFAULT_SETTINGS: LoyaltyGreetingSettings = {
  greetNewViewers: false,
  newViewerTexts: ['Willkommen im Chat, {user}!'],
  personalGreetings: []
}

let greetedUsers = new Set<string>()
/** Stream-ID, für die `greetedUsers` zuletzt aus der DB befüllt wurde. */
let seededStreamId: string | null = null
let greetingTimer: NodeJS.Timeout | null = null

/**
 * Lädt bereits begrüßte Logins aus der DB, sobald eine (neue) Stream-ID bekannt wird.
 * Verhindert, dass ein Bot-Neustart mitten im laufenden Stream alle Anwesenden erneut begrüßt.
 */
function ensureSeededForStream(streamId: string): void {
  if (seededStreamId === streamId) return
  seededStreamId = streamId
  greetedUsers = new Set(listGreetedLogins(streamId))
}

function cleanTexts(texts: string[]): string[] {
  return texts.map((text) => text.trim()).filter((text) => text.length > 0)
}

function cleanLogin(login: string): string {
  return login.trim().replace(/^@/, '').toLowerCase()
}

function cleanPersonalGreeting(rule: LoyaltyPersonalGreeting): LoyaltyPersonalGreeting | null {
  const userLogin = cleanLogin(rule.userLogin)
  const texts = cleanTexts(rule.texts)
  if (!rule.id || !userLogin || texts.length === 0) return null

  return {
    id: String(rule.id),
    userLogin,
    enabled: Boolean(rule.enabled),
    texts
  }
}

export function getGreetingSettings(): LoyaltyGreetingSettings {
  const raw = getSetting(GREETING_SETTINGS_KEY)
  if (!raw) return DEFAULT_SETTINGS

  try {
    const parsed = JSON.parse(raw) as Partial<LoyaltyGreetingSettings>
    const personalGreetings = Array.isArray(parsed.personalGreetings)
      ? parsed.personalGreetings
          .map((rule) => cleanPersonalGreeting(rule as LoyaltyPersonalGreeting))
          .filter((rule): rule is LoyaltyPersonalGreeting => Boolean(rule))
      : []

    return {
      greetNewViewers: Boolean(parsed.greetNewViewers),
      newViewerTexts: Array.isArray(parsed.newViewerTexts)
        ? cleanTexts(parsed.newViewerTexts)
        : DEFAULT_SETTINGS.newViewerTexts,
      personalGreetings
    }
  } catch (error) {
    logger.warn('Greeting-Einstellungen konnten nicht gelesen werden', error)
    return DEFAULT_SETTINGS
  }
}

export function setGreetingSettings(settings: LoyaltyGreetingSettings): LoyaltyGreetingSettings {
  const cleaned: LoyaltyGreetingSettings = {
    greetNewViewers: Boolean(settings.greetNewViewers),
    newViewerTexts: cleanTexts(settings.newViewerTexts),
    personalGreetings: settings.personalGreetings
      .map(cleanPersonalGreeting)
      .filter((rule): rule is LoyaltyPersonalGreeting => Boolean(rule))
  }

  setSetting(GREETING_SETTINGS_KEY, JSON.stringify(cleaned))
  return cleaned
}

function pickText(texts: string[]): string | null {
  if (texts.length === 0) return null
  return texts[Math.floor(Math.random() * texts.length)]
}

function personalize(text: string, userLogin: string): string {
  return resolveTextPlaceholders(text)
    .replaceAll('{user}', userLogin)
    .replaceAll('{name}', userLogin)
}

export async function handleViewerGreeting(userLogin: string): Promise<void> {
  const login = cleanLogin(userLogin)
  if (!login) return

  const streamId = getCurrentStreamId()
  if (streamId) ensureSeededForStream(streamId)
  if (greetedUsers.has(login)) return

  const sender = getActiveChatClient()
  const channel = getSetting('target_channel')
  if (!channel || !sender) return
  if (login === cleanLogin(channel) || isKnownStreamerBot(login) || isGreetingBlacklisted(login))
    return

  const settings = getGreetingSettings()
  const personalRule = settings.personalGreetings.find(
    (rule) => rule.enabled && rule.userLogin === login
  )
  const text =
    pickText(personalRule?.texts ?? []) ??
    (settings.greetNewViewers ? pickText(settings.newViewerTexts) : null)

  if (!text) return

  greetedUsers.add(login)
  if (streamId) markGreeted(streamId, login)
  try {
    await sender.say(channel, personalize(text, login))
  } catch (error) {
    greetedUsers.delete(login)
    logger.error(`Greeting fuer ${login} konnte nicht gesendet werden`, error)
  }
}

async function greetPresentUsers(): Promise<void> {
  for (const userLogin of getPresentUsers()) {
    await handleViewerGreeting(userLogin)
  }
}

export function startGreetingChecker(): void {
  stopGreetingChecker()
  void greetPresentUsers()
  greetingTimer = setInterval(() => void greetPresentUsers(), 20_000)
}

export function stopGreetingChecker(): void {
  if (greetingTimer) clearInterval(greetingTimer)
  greetingTimer = null
}

export function clearGreetingSession(): void {
  stopGreetingChecker()
  greetedUsers.clear()
  seededStreamId = null
}
