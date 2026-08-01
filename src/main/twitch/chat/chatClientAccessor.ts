import type { Client } from 'tmi.js'

/**
 * Zentrale Accessor-Schicht für den aktiven Chat-Sender-Client.
 * Vermeidet zirkuläre Imports zwischen tmiClient.ts, modTmiClient.ts und
 * den Schedulern/Routern, die den Client zum Senden benötigen.
 */

let broadcasterClient: Client | null = null
let modClient: Client | null = null

export function setBroadcasterClientRef(client: Client | null): void {
  broadcasterClient = client
}

export function setModClientRef(client: Client | null): void {
  modClient = client
}

/**
 * Gibt den Mod-Client zurück, falls vorhanden und verbunden, sonst den Broadcaster-Client.
 * Wird von Commands, Automessages und Games genutzt um den richtigen Sender zu wählen.
 */
export function getActiveChatClient(): Client | null {
  return modClient ?? broadcasterClient
}
