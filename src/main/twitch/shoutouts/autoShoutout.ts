import { getSetting, setSetting } from '../../db/repositories/appSettings.repo'
import { sendShoutout } from '../helix/shoutouts.api'
import { logger } from '../../logger'

const KEY_ENABLED = 'auto_shoutout_enabled'

/** Twitch erlaubt einen Shoutout alle 2 Minuten... */
const GLOBAL_COOLDOWN_MS = 2 * 60_000
/** ...und pro Zielkanal nur alle 60 Minuten. */
const PER_TARGET_COOLDOWN_MS = 60 * 60_000

let lastShoutoutAt = 0
const lastShoutoutPerTarget = new Map<string, number>()

export function getAutoShoutoutEnabled(): boolean {
  return getSetting(KEY_ENABLED) === '1'
}

export function setAutoShoutoutEnabled(enabled: boolean): void {
  setSetting(KEY_ENABLED, enabled ? '1' : '0')
}

/**
 * Prueft die Twitch-Rate-Limits vorab, statt in einen 429 zu laufen. Twitch zaehlt
 * abgelehnte Anfragen mit, deshalb wird hier lokal mitgezaehlt.
 */
function isWithinCooldown(targetBroadcasterId: string, now: number): boolean {
  if (now - lastShoutoutAt < GLOBAL_COOLDOWN_MS) return true
  const lastForTarget = lastShoutoutPerTarget.get(targetBroadcasterId)
  return lastForTarget !== undefined && now - lastForTarget < PER_TARGET_COOLDOWN_MS
}

/**
 * Sendet automatisch einen Shoutout an den raidenden Kanal.
 * @param fromBroadcasterId Eigener Kanal (Empfaenger des Raids)
 * @param raiderBroadcasterId Kanal, der den Raid ausgeloest hat
 * @param raiderLogin Login des Raiders, nur fuer die Log-Ausgabe
 */
export async function handleRaidShoutout(
  fromBroadcasterId: string,
  raiderBroadcasterId: string,
  raiderLogin: string
): Promise<void> {
  if (!getAutoShoutoutEnabled()) return
  if (!raiderBroadcasterId || raiderBroadcasterId === fromBroadcasterId) return

  const now = Date.now()
  if (isWithinCooldown(raiderBroadcasterId, now)) {
    logger.info(`Auto-Shoutout fuer ${raiderLogin} uebersprungen (Cooldown aktiv)`)
    return
  }

  const result = await sendShoutout(fromBroadcasterId, raiderBroadcasterId)

  if (result.ok) {
    lastShoutoutAt = now
    lastShoutoutPerTarget.set(raiderBroadcasterId, now)
    logger.info(`Auto-Shoutout an ${raiderLogin} gesendet`)
    return
  }

  if (result.reason === 'no_actor') {
    logger.warn(
      'Auto-Shoutout nicht moeglich: Kein verbundener Account hat den Scope "moderator:manage:shoutouts". Feature in den Einstellungen aktivieren und den Account neu autorisieren.'
    )
    return
  }

  if (result.reason === 'rate_limited') {
    // Twitch hat abgelehnt, obwohl der lokale Cooldown frei war (z.B. weil manuell
    // ein Shoutout gesendet wurde). Lokalen Zaehler nachziehen.
    lastShoutoutAt = now
    lastShoutoutPerTarget.set(raiderBroadcasterId, now)
    logger.info(`Auto-Shoutout fuer ${raiderLogin} von Twitch wegen Rate-Limit abgelehnt`)
    return
  }

  logger.error(`Auto-Shoutout an ${raiderLogin} fehlgeschlagen: ${result.detail ?? 'unbekannt'}`)
}

/** Setzt die Cooldown-Zaehler zurueck, z.B. beim Trennen der Verbindung. */
export function resetShoutoutCooldowns(): void {
  lastShoutoutAt = 0
  lastShoutoutPerTarget.clear()
}
