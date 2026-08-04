import type { ChatMessageSegment } from '@shared/types/chat'
import { getUserIdByLogin } from '../helix/users.api'
import { logger } from '../../logger'

/**
 * BetterTTV-Emotes (und potenziell FFZ/7TV nach demselben Muster) sind reiner Text
 * in der Chat-Nachricht -- anders als native Twitch-Emotes gibt es dafuer keine
 * Positions-Metadaten in den IRC-Tags. Wir laden die bekannten Codes einmal pro
 * Verbindung und suchen sie danach selbst wortweise im Nachrichtentext (siehe
 * applyThirdPartyEmotes).
 */

interface BttvEmote {
  id: string
  code: string
}

interface BttvChannelResponse {
  channelEmotes: BttvEmote[]
  sharedEmotes: BttvEmote[]
}

const emoteMap = new Map<string, string>()

function bttvEmoteUrl(id: string): string {
  return `https://cdn.betterttv.net/emote/${id}/2x`
}

function cacheEmotes(emotes: BttvEmote[]): void {
  for (const emote of emotes) {
    emoteMap.set(emote.code, bttvEmoteUrl(emote.id))
  }
}

/** Laedt globale + kanalspezifische BetterTTV-Emotes. Schlaegt still fehl -- BTTV ist optional. */
export async function prepareThirdPartyEmotes(channelLogin: string): Promise<void> {
  emoteMap.clear()

  try {
    const globalResponse = await fetch('https://api.betterttv.net/3/cache/emotes/global')
    if (globalResponse.ok) {
      cacheEmotes((await globalResponse.json()) as BttvEmote[])
    }
  } catch (error) {
    logger.warn('Globale BetterTTV-Emotes konnten nicht geladen werden', error)
  }

  try {
    const broadcasterId = await getUserIdByLogin(channelLogin)
    if (!broadcasterId) return

    const channelResponse = await fetch(
      `https://api.betterttv.net/3/cache/users/twitch/${broadcasterId}`
    )
    // 404 ist der Normalfall fuer Kanaele ohne eigene BTTV-Emotes.
    if (channelResponse.ok) {
      const data = (await channelResponse.json()) as BttvChannelResponse
      cacheEmotes(data.channelEmotes)
      cacheEmotes(data.sharedEmotes)
    }
  } catch (error) {
    logger.warn('Kanal-BetterTTV-Emotes konnten nicht geladen werden', error)
  }
}

/**
 * Ersetzt bekannte BetterTTV-Emote-Codes in Text-Segmenten durch Emote-Segmente.
 * Laeuft nach formatChatSegments (native Twitch-Emotes haben Vorrang/Positionsdaten).
 */
export function applyThirdPartyEmotes(segments: ChatMessageSegment[]): ChatMessageSegment[] {
  if (emoteMap.size === 0) return segments

  const result: ChatMessageSegment[] = []
  for (const segment of segments) {
    if (segment.type !== 'text') {
      result.push(segment)
      continue
    }

    for (const word of segment.text.split(/(\s+)/)) {
      const url = word && emoteMap.get(word)
      if (url) {
        result.push({ type: 'emote', text: word, url })
        continue
      }
      if (word.length === 0) continue

      const last = result[result.length - 1]
      if (last?.type === 'text') {
        last.text += word
      } else {
        result.push({ type: 'text', text: word })
      }
    }
  }
  return result
}
