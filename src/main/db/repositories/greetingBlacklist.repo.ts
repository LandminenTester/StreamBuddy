import { getDb } from '../connection'
import type { GreetingBlacklistEntry } from '@shared/types/loyalty'

export function listBlacklistedLogins(): GreetingBlacklistEntry[] {
  return getDb()
    .prepare<[], { login: string }>('SELECT login FROM greeting_blacklist ORDER BY login ASC')
    .all()
    .map((row) => ({ userLogin: row.login }))
}

export function isGreetingBlacklisted(userLogin: string): boolean {
  const row = getDb()
    .prepare<[string], { login: string }>('SELECT login FROM greeting_blacklist WHERE login = ?')
    .get(userLogin)
  return Boolean(row)
}

export function setGreetingBlacklisted(userLogin: string, blacklisted: boolean): void {
  if (blacklisted) {
    getDb()
      .prepare(
        `INSERT INTO greeting_blacklist (login, blacklisted_at)
         VALUES (@login, @blacklistedAt)
         ON CONFLICT (login) DO NOTHING`
      )
      .run({ login: userLogin, blacklistedAt: Math.floor(Date.now() / 1000) })
  } else {
    getDb().prepare('DELETE FROM greeting_blacklist WHERE login = ?').run(userLogin)
  }
}
