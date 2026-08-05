import { UNAVAILABLE_FEATURE_KEYS, UNAVAILABLE_GAME_IDS } from '@shared/temporarilyUnavailable'
import { setFeatureEnabled, listFeatureScopes } from './db/repositories/authTokens.repo'
import { listGameConfigs, upsertGameConfig } from './db/repositories/loyalty.repo'
import { getGameRuntimeConfig } from './loyalty/games/gameRegistry'
import { getAdMessageSettings, setAdMessageSettings } from './twitch/ads/adMessageSettings'
import { logger } from './logger'

/**
 * Setzt Features/Spiele, die aktuell wegen einer Twitch-API-Einschraenkung nicht
 * nutzbar sind, beim Start zwangsweise zurueck -- falls sie aus einer frueheren
 * Version noch als aktiviert in der DB stehen. isGameEnabled/toggleFeature blocken
 * das zur Laufzeit ohnehin, das hier haelt nur den gespeicherten Stand konsistent.
 */
export function enforceTemporarilyUnavailableDefaults(): void {
  const enabledFeatures = new Set(
    listFeatureScopes()
      .filter((f) => f.enabled)
      .map((f) => f.featureKey)
  )
  for (const featureKey of UNAVAILABLE_FEATURE_KEYS) {
    if (enabledFeatures.has(featureKey)) {
      setFeatureEnabled(featureKey, false)
      logger.info(`Feature "${featureKey}" wegen Twitch-API-Einschraenkung zurueckgesetzt`)
    }
  }

  const adMessageSettings = getAdMessageSettings()
  if (adMessageSettings.enabled) {
    setAdMessageSettings({ ...adMessageSettings, enabled: false })
    logger.info('Werbungsnachrichten wegen Twitch-API-Einschraenkung zurueckgesetzt')
  }

  const gameConfigs = listGameConfigs()
  for (const gameId of UNAVAILABLE_GAME_IDS) {
    const stored = gameConfigs.find((c) => c.gameId === gameId)
    if (stored?.enabled) {
      upsertGameConfig(gameId, false, getGameRuntimeConfig(gameId))
      logger.info(`Spiel "${gameId}" wegen Twitch-API-Einschraenkung zurueckgesetzt`)
    }
  }
}
