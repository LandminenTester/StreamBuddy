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
      'Die Bude hat geschlossen! Erst wenn der Chef wieder da ist, geht es weiter.',
      'Kein Stream, keine Punkte -- das Loyalty-Casino macht gerade Pause.',
      'Feierabend hier. Komm wieder, wenn der Stream laeuft!',
      'Die Kasse ist zu. Ohne Chef laeuft hier nichts.',
      'Ruhe im Laden -- die Spiele oeffnen erst wieder, wenn es live geht.'
    ],
    gameTexts: {
      gamble: {
        cooldown: ['@{user} Gamble-Cooldown: noch {seconds}s warten.'],
        usage: ['@{user} Nutzung: !gamble <Einsatz|all|xx%> ({limit}, max. Kontostand: {balance})'],
        win: ['@{user} Gewonnen! +{amount} Punkte.'],
        loss: ['@{user} Verloren. -{amount} Punkte.']
      },
      duel: {
        usage: ['@{user} Nutzung: !duel @user <Einsatz|all|xx%>'],
        selfChallenge: ['@{user} Du kannst nicht gegen dich selbst antreten.'],
        challenge: [
          '@{opponent} wurde von @{challenger} zu einem Duell um {amount} Punkte herausgefordert! Mit "{acceptTrigger}" annehmen ({seconds}s Zeit). @{challenger} kann mit !cancel abbrechen.'
        ],
        noPending: ['@{user} Keine offene Duell-Anfrage.'],
        insufficientFunds: [
          '@{user} Duell abgebrochen -- nicht genug Punkte bei einem der Teilnehmer.'
        ],
        result: ['Duell entschieden: @{winner} gewinnt {amount} Punkte von @{loser}!']
      },
      roulette: {
        roundStart: [
          'Neue Roulette-Runde! {seconds}s Zeit zum Setzen: !red / !black / !green / !number <0-36> <Einsatz|all|xx%>.',
          'Setzt eure Punkte! {seconds}s bis die Kugel rollt -- !red, !black, !green oder !number.',
          'Runde eroeffnet! {seconds}s Wettfenster: !red / !black / !green / !number <Zahl> <Einsatz>.'
        ],
        spinning: [
          'Die Kugel rollt und dreht sich...',
          'Alles auf Rot, Schwarz, Gruen oder eine Zahl? Die Kugel laeuft...',
          'Und sie dreht sich... gleich ist es soweit!'
        ],
        result: [
          '{colorEmoji} {number} ({color}) gewinnt! {winners}/{total} Wetten haben gewonnen. {winnerDetails}',
          'Die Kugel landet auf {colorEmoji} {number} ({color})! {winners}/{total} Gewinner. {winnerDetails}',
          'Es ist {colorEmoji} {number} ({color})! {winners} von {total} Wetten waren richtig. {winnerDetails}'
        ],
        noBets: [
          'Keine Wetten gesetzt -- die Kugel landet auf {colorEmoji} {number} ({color}).',
          'Leere Runde: {colorEmoji} {number} ({color}). Naechste Runde startet gleich.'
        ]
      },
      ssp: {
        usage: ['@{user} Nutzung: !ssp @user <Punkte|all|xx%>'],
        selfChallenge: ['@{user} Du kannst nicht gegen dich selbst spielen.'],
        alreadyPlaying: ['@{user} Einer von euch spielt bereits Schere Stein Papier.'],
        challenge: [
          '@{opponent} wurde von @{challenger} zu Schere Stein Papier um {amount} Punkte herausgefordert. Mit !ssp accept annehmen. @{challenger} kann mit !cancel abbrechen.'
        ],
        noPending: ['@{user} Keine offene SSP-Herausforderung.'],
        insufficientFunds: ['@{user} SSP abgebrochen -- nicht genug Punkte bei einem Teilnehmer.'],
        privateOptions: [
          'SSP gegen @{opponent}: Antworte mit !ssp 1, !ssp 2 oder !ssp 3. Deine Zuordnung: {mapping}.'
        ],
        accepted: [
          'SSP zwischen @{challenger} und @{opponent} wurde angenommen. Beide haben ihre Optionen privat erhalten.'
        ],
        privateDeliveryFailed: [
          '@{challenger} @{opponent} SSP abgebrochen -- private Optionen konnten nicht zugestellt werden.'
        ],
        noActive: ['Du hast gerade kein aktives SSP-Spiel.'],
        alreadyChosen: ['Deine SSP-Auswahl wurde bereits gespeichert.'],
        choiceSaved: ['Auswahl gespeichert: {choice}. Warte auf den anderen Spieler.'],
        draw: [
          'SSP endet unentschieden: @{challenger} ({challengerMove}) gegen @{opponent} ({opponentMove}).'
        ],
        payoutFailed: ['SSP abgebrochen -- Punkte konnten beim Abschluss nicht gebucht werden.'],
        result: [
          'SSP entschieden: @{winner} gewinnt {amount} Punkte! @{challenger} ({challengerMove}) gegen @{opponent} ({opponentMove}).'
        ]
      }
    }
  },
  en: {
    offlineMessages: [
      'The place is closed! Nothing happens until the boss is back.',
      'No stream, no points -- the loyalty casino is on a break.',
      'Closing time. Come back when the stream is live!',
      'The till is shut. Nothing runs here without the boss.',
      'All quiet -- the games reopen once we go live.'
    ],
    gameTexts: {
      gamble: {
        cooldown: ['@{user} Gamble cooldown: wait {seconds}s.'],
        usage: ['@{user} Usage: !gamble <bet|all|xx%> ({limit}, max balance: {balance})'],
        win: ['@{user} You won! +{amount} points.'],
        loss: ['@{user} You lost. -{amount} points.']
      },
      duel: {
        usage: ['@{user} Usage: !duel @user <bet|all|xx%>'],
        selfChallenge: ['@{user} You cannot duel yourself.'],
        challenge: [
          '@{opponent} was challenged by @{challenger} to a duel for {amount} points! Accept with "{acceptTrigger}" ({seconds}s). @{challenger} can cancel with !cancel.'
        ],
        noPending: ['@{user} No pending duel request.'],
        insufficientFunds: [
          '@{user} Duel canceled -- one participant does not have enough points.'
        ],
        result: ['Duel decided: @{winner} wins {amount} points from @{loser}!']
      },
      roulette: {
        roundStart: [
          'New roulette round! {seconds}s to place your bets: !red / !black / !green / !number <0-36> <bet|all|xx%>.',
          'Put your points down! {seconds}s until the ball rolls -- !red, !black, !green or !number.',
          'Round is open! {seconds}s betting window: !red / !black / !green / !number <number> <bet>.'
        ],
        spinning: [
          'The ball is rolling...',
          'Red, black, green or a number? The ball is running...',
          'And it spins... almost there!'
        ],
        result: [
          '{colorEmoji} {number} ({color}) wins! {winners}/{total} bets came through. {winnerDetails}',
          'The ball lands on {colorEmoji} {number} ({color})! {winners}/{total} winners. {winnerDetails}',
          'It is {colorEmoji} {number} ({color})! {winners} of {total} bets were right. {winnerDetails}'
        ],
        noBets: [
          'No bets placed -- the ball lands on {colorEmoji} {number} ({color}).',
          'Empty round: {colorEmoji} {number} ({color}). Next round starts soon.'
        ]
      },
      ssp: {
        usage: ['@{user} Usage: !ssp @user <points|all|xx%>'],
        selfChallenge: ['@{user} You cannot play against yourself.'],
        alreadyPlaying: ['@{user} One of you is already playing Rock Paper Scissors.'],
        challenge: [
          '@{opponent} was challenged by @{challenger} to Rock Paper Scissors for {amount} points. Accept with !ssp accept. @{challenger} can cancel with !cancel.'
        ],
        noPending: ['@{user} No pending RPS challenge.'],
        insufficientFunds: ['@{user} RPS canceled -- one participant does not have enough points.'],
        privateOptions: [
          'RPS against @{opponent}: reply with !ssp 1, !ssp 2 or !ssp 3. Your mapping: {mapping}.'
        ],
        accepted: [
          'RPS between @{challenger} and @{opponent} was accepted. Both players received their options privately.'
        ],
        privateDeliveryFailed: [
          '@{challenger} @{opponent} RPS canceled -- private options could not be delivered.'
        ],
        noActive: ['You do not have an active RPS game.'],
        alreadyChosen: ['Your RPS choice was already saved.'],
        choiceSaved: ['Choice saved: {choice}. Waiting for the other player.'],
        draw: ['RPS is a draw: @{challenger} ({challengerMove}) vs @{opponent} ({opponentMove}).'],
        payoutFailed: ['RPS canceled -- points could not be booked.'],
        result: [
          'RPS decided: @{winner} wins {amount} points! @{challenger} ({challengerMove}) vs @{opponent} ({opponentMove}).'
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
