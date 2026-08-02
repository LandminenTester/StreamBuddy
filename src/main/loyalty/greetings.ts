import type { LoyaltyGreetingSettings, LoyaltyPersonalGreeting } from '@shared/types/loyalty'
import { getSetting, setSetting } from '../db/repositories/appSettings.repo'
import { getActiveChatClient } from '../twitch/chat/chatClientAccessor'
import { logger } from '../logger'

const GREETING_SETTINGS_KEY = 'loyalty_greetings'

const DEFAULT_SETTINGS: LoyaltyGreetingSettings = {
  greetNewViewers: false,
  newViewerTexts: ['Willkommen im Chat, {user}!'],
  personalGreetings: []
}

const greetedUsers = new Set<string>()

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
  return text.replaceAll('{user}', userLogin).replaceAll('{name}', userLogin)
}

export async function handleViewerGreeting(userLogin: string): Promise<void> {
  const login = cleanLogin(userLogin)
  if (!login || greetedUsers.has(login)) return

  const sender = getActiveChatClient()
  const channel = getSetting('target_channel')
  if (!channel || !sender) return

  const settings = getGreetingSettings()
  const personalRule = settings.personalGreetings.find(
    (rule) => rule.enabled && rule.userLogin === login
  )
  const text =
    pickText(personalRule?.texts ?? []) ??
    (settings.greetNewViewers ? pickText(settings.newViewerTexts) : null)

  if (!text) return

  greetedUsers.add(login)
  try {
    await sender.say(channel, personalize(text, login))
  } catch (error) {
    greetedUsers.delete(login)
    logger.error(`Greeting fuer ${login} konnte nicht gesendet werden`, error)
  }
}

export function clearGreetingSession(): void {
  greetedUsers.clear()
}
