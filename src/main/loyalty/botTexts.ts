import type { AppLocale } from '@shared/types/appInfo'
import { setMessageSet } from '../db/repositories/botMessages.repo'
import { listGameConfigs, upsertGameConfig } from '../db/repositories/loyalty.repo'
import { LOYALTY_OFFLINE_MESSAGE_KEY } from './offlineMessages'

interface BotTextSet {
  /** Meldungen, wenn Loyalty-Aktionen bei offlinem Stream versucht werden. */
  offlineMessages: string[]
  /** gameId -> Text-Slot -> Textvarianten. */
  gameTexts: Record<string, Record<string, string[]>>
}

/**
 * Chat-Texte des Bots je Sprache. Diese gehoeren zur Kanalsprache, nicht zur
 * Oberflaechensprache: sie werden ausschliesslich beim Abschluss des Setup-Wizards
 * geschrieben und von einem spaeteren Sprachwechsel nicht mehr angefasst.
 */
export const BOT_TEXTS: Record<AppLocale, BotTextSet> = {
  de: {
    offlineMessages: [
      '🔒 Die Bude hat geschlossen! Erst wenn der Chef wieder da ist, geht es weiter.',
      '😴 Kein Stream, keine Punkte -- das Loyalty-Casino macht gerade Pause.',
      '🚪 Feierabend hier. Komm wieder, wenn der Stream läuft!',
      '🛑 Die Kasse ist zu. Ohne Chef läuft hier nichts.',
      '💤 Ruhe im Laden -- die Spiele öffnen erst wieder, wenn es live geht.'
    ],
    gameTexts: {
      roulette: {
        roundStart: [
          '🎡 Neue Roulette-Runde! {seconds}s Zeit zum Setzen: !red / !black / !green / !number <0-36> <Einsatz|all|xx%> -- nur eine Wette pro Runde!',
          '🎲 Setzt eure Punkte! {seconds}s bis die Kugel rollt -- !red, !black, !green oder !number, nur eine Wette erlaubt.',
          '🎰 Runde eröffnet! {seconds}s Wettfenster: !red / !black / !green / !number <Zahl> <Einsatz>. Grün und Zahlen zahlen am meisten, aber am seltensten!'
        ],
        spinning: [
          '🎡 Die Kugel rollt und dreht sich...',
          '🌀 Alles auf Rot, Schwarz, Grün oder eine Zahl? Die Kugel läuft...',
          '🎲 Und sie dreht sich... gleich ist es soweit!'
        ],
        result: [
          '🎉 {colorEmoji} {number} ({color}) gewinnt! {winners}/{total} Wetten haben gewonnen.',
          '🏆 Die Kugel landet auf {colorEmoji} {number} ({color})! {winners}/{total} Gewinner.',
          '🎊 Es ist {colorEmoji} {number} ({color})! {winners} von {total} Wetten waren richtig.'
        ]
      }
    }
  },
  en: {
    offlineMessages: [
      "🔒 The place is closed! Nothing happens until the boss is back.",
      '😴 No stream, no points -- the loyalty casino is on a break.',
      '🚪 Closing time. Come back when the stream is live!',
      '🛑 The till is shut. Nothing runs here without the boss.',
      '💤 All quiet -- the games reopen once we go live.'
    ],
    gameTexts: {
      roulette: {
        roundStart: [
          '🎡 New roulette round! {seconds}s to place your bets: !red / !black / !green / !number <0-36> <bet|all|xx%> -- one bet per round!',
          '🎲 Put your points down! {seconds}s until the ball rolls -- !red, !black, !green or !number, one bet only.',
          '🎰 Round is open! {seconds}s betting window: !red / !black / !green / !number <number> <bet>. Green and numbers pay the most, but land the least!'
        ],
        spinning: [
          '🎡 The ball is rolling...',
          '🌀 Red, black, green or a number? The ball is running...',
          '🎲 And it spins... almost there!'
        ],
        result: [
          '🎉 {colorEmoji} {number} ({color}) wins! {winners}/{total} bets came through.',
          '🏆 The ball lands on {colorEmoji} {number} ({color})! {winners}/{total} winners.',
          '🎊 It is {colorEmoji} {number} ({color})! {winners} of {total} bets were right.'
        ]
      }
    }
  }
}

/**
 * Schreibt die Bot-Chat-Texte der gewaehlten Sprache in die DB. Wird nur beim
 * Abschluss des Setup-Wizards aufgerufen -- ein spaeterer Wechsel der
 * Oberflaechensprache laesst die Texte unangetastet.
 * @param locale Sprache, deren Standardtexte uebernommen werden sollen
 */
export function seedBotTextsForLocale(locale: AppLocale): void {
  const texts = BOT_TEXTS[locale] ?? BOT_TEXTS.de

  setMessageSet(LOYALTY_OFFLINE_MESSAGE_KEY, texts.offlineMessages)

  const configs = listGameConfigs()
  for (const [gameId, gameTexts] of Object.entries(texts.gameTexts)) {
    const existing = configs.find((config) => config.gameId === gameId)
    upsertGameConfig(
      gameId,
      existing?.enabled ?? true,
      existing?.config ?? {},
      existing?.displayName ?? null,
      existing?.commandTriggers ?? {},
      gameTexts
    )
  }
}
