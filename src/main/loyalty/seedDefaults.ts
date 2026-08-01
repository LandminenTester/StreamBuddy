import { seedDefaultEarnRule } from '../db/repositories/loyalty.repo'
import { seedDefaultMessageSet } from '../db/repositories/botMessages.repo'
import { seedGameDefaults } from './games/gameRegistry'
import { BOT_TEXTS } from './botTexts'
import { LOYALTY_OFFLINE_MESSAGE_KEY } from './offlineMessages'

/**
 * Sinnvolle Default-Werte für Loyalty-Earn-Rules und Games, nur beim allerersten Start gesetzt.
 * Die Chat-Texte kommen hier in der Master-Sprache Deutsch -- der Setup-Wizard überschreibt sie
 * danach mit der tatsächlich gewählten Sprache (siehe botTexts.ts).
 */
export function seedLoyaltyDefaults(): void {
  seedDefaultEarnRule({ reason: 'follow', points: 50, enabled: true, cooldownSeconds: 0 })
  seedDefaultEarnRule({ reason: 'sub', points: 200, enabled: true, cooldownSeconds: 0 })
  seedDefaultEarnRule({ reason: 'gift_sub', points: 200, enabled: true, cooldownSeconds: 0 })
  seedDefaultEarnRule({ reason: 'view_time', points: 10, enabled: true, cooldownSeconds: 300 })
  seedGameDefaults()
  seedDefaultMessageSet(LOYALTY_OFFLINE_MESSAGE_KEY, BOT_TEXTS.de.offlineMessages)
}
