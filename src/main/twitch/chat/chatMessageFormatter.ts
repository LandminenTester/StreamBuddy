import type { ChatMessageSegment } from '@shared/types/chat'

interface EmoteRange {
  id: string
  start: number
  end: number
}

function emoteUrl(id: string): string {
  return `https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/dark/1.0`
}

export function formatChatSegments(
  message: string,
  emotes: Record<string, string[]> | undefined
): ChatMessageSegment[] {
  if (!emotes) return [{ type: 'text', text: message }]

  const ranges: EmoteRange[] = []
  for (const [id, positions] of Object.entries(emotes)) {
    for (const position of positions) {
      const [startRaw, endRaw] = position.split('-')
      const start = Number(startRaw)
      const end = Number(endRaw)
      if (Number.isInteger(start) && Number.isInteger(end)) {
        ranges.push({ id, start, end })
      }
    }
  }

  ranges.sort((a, b) => a.start - b.start)
  const segments: ChatMessageSegment[] = []
  let cursor = 0

  for (const range of ranges) {
    if (range.start > cursor) {
      segments.push({ type: 'text', text: message.slice(cursor, range.start) })
    }
    const text = message.slice(range.start, range.end + 1)
    segments.push({ type: 'emote', text, url: emoteUrl(range.id) })
    cursor = range.end + 1
  }

  if (cursor < message.length) {
    segments.push({ type: 'text', text: message.slice(cursor) })
  }

  return segments.length > 0 ? segments : [{ type: 'text', text: message }]
}
