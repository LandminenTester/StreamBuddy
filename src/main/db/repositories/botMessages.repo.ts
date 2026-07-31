import { getDb } from '../connection'

/** Generischer Key/Value-Store für rotierende Bot-Ansagetexte (JSON-Array pro Key). */
export function getMessageSet(key: string): string[] {
  const row = getDb()
    .prepare<[string], { messages: string }>('SELECT messages FROM bot_message_sets WHERE key = ?')
    .get(key)
  return row ? (JSON.parse(row.messages) as string[]) : []
}

export function setMessageSet(key: string, messages: string[]): void {
  getDb()
    .prepare(
      `INSERT INTO bot_message_sets (key, messages) VALUES (@key, @messages)
       ON CONFLICT (key) DO UPDATE SET messages = @messages`
    )
    .run({ key, messages: JSON.stringify(messages) })
}

/** Legt ein Default-Nachrichtenset nur an, falls noch keins existiert -- überschreibt keine spätere Nutzer-Anpassung. */
export function seedDefaultMessageSet(key: string, messages: string[]): void {
  getDb()
    .prepare(`INSERT OR IGNORE INTO bot_message_sets (key, messages) VALUES (@key, @messages)`)
    .run({ key, messages: JSON.stringify(messages) })
}

/** Zufällige Nachricht aus dem Set, oder ein Leerstring falls keine Varianten existieren. */
export function pickRandomMessage(key: string): string {
  const messages = getMessageSet(key)
  if (messages.length === 0) return ''
  return messages[Math.floor(Math.random() * messages.length)]
}
