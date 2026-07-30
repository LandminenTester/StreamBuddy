import { getDb } from '../connection'
import type {
  LoyaltyAccount,
  LoyaltyEarnRule,
  LoyaltyGameConfig,
  LoyaltyLeaderboardEntry,
  LoyaltyTransaction,
  LoyaltyTransactionReason
} from '@shared/types/loyalty'

interface AccountRow {
  id: number
  user_login: string
  balance: number
  total_earned: number
  total_wagered: number
  last_seen_at: number | null
}

function accountToDomain(row: AccountRow): LoyaltyAccount {
  return {
    id: row.id,
    userLogin: row.user_login,
    balance: row.balance,
    totalEarned: row.total_earned,
    totalWagered: row.total_wagered,
    lastSeenAt: row.last_seen_at
  }
}

/** Holt oder erstellt das Loyalty-Konto eines Chatters (case-insensitiver Login). */
export function getOrCreateAccount(userLogin: string): LoyaltyAccount {
  const login = userLogin.toLowerCase()
  const db = getDb()

  const existing = db
    .prepare<[string], AccountRow>('SELECT * FROM loyalty_accounts WHERE user_login = ?')
    .get(login)

  if (existing) return accountToDomain(existing)

  const result = db
    .prepare('INSERT INTO loyalty_accounts (user_login, balance) VALUES (?, 0)')
    .run(login)

  const row = db
    .prepare<[number], AccountRow>('SELECT * FROM loyalty_accounts WHERE id = ?')
    .get(Number(result.lastInsertRowid))!

  return accountToDomain(row)
}

/**
 * Bucht eine Loyalty-Transaktion atomar: Ledger-Eintrag + Balance-Fortschreibung
 * in einer Transaktion (siehe loyaltyLedger.ts als einzige Aufrufstelle, Phase 7).
 */
export function applyTransaction(
  accountId: number,
  amount: number,
  reason: LoyaltyTransactionReason,
  gameId: string | null
): LoyaltyTransaction {
  const db = getDb()

  return db.transaction(() => {
    const now = Date.now()

    db.prepare(
      `UPDATE loyalty_accounts SET
         balance = balance + @amount,
         total_earned = total_earned + MAX(@amount, 0),
         total_wagered = total_wagered + CASE WHEN @reason IN ('game_win', 'game_loss') THEN ABS(@amount) ELSE 0 END,
         last_seen_at = @now
       WHERE id = @accountId`
    ).run({ accountId, amount, reason, now })

    const result = db
      .prepare(
        `INSERT INTO loyalty_transactions (account_id, amount, reason, game_id, created_at)
         VALUES (@accountId, @amount, @reason, @gameId, @now)`
      )
      .run({ accountId, amount, reason, gameId, now })

    return {
      id: Number(result.lastInsertRowid),
      accountId,
      amount,
      reason,
      gameId,
      createdAt: now
    }
  })()
}

export function getLeaderboard(limit = 25): LoyaltyLeaderboardEntry[] {
  const rows = getDb()
    .prepare<[number], AccountRow>('SELECT * FROM loyalty_accounts ORDER BY balance DESC LIMIT ?')
    .all(limit)

  return rows.map((row, index) => ({
    userLogin: row.user_login,
    balance: row.balance,
    rank: index + 1
  }))
}

interface EarnRuleRow {
  reason: LoyaltyEarnRule['reason']
  points: number
  enabled: number
  cooldown_seconds: number
}

export function listEarnRules(): LoyaltyEarnRule[] {
  return getDb()
    .prepare<[], EarnRuleRow>('SELECT * FROM loyalty_earn_rules')
    .all()
    .map((row) => ({
      reason: row.reason,
      points: row.points,
      enabled: Boolean(row.enabled),
      cooldownSeconds: row.cooldown_seconds
    }))
}

/** Legt eine Default-Earn-Rule nur an, falls noch keine existiert -- überschreibt keine spätere Nutzer-Anpassung. */
export function seedDefaultEarnRule(rule: LoyaltyEarnRule): void {
  getDb()
    .prepare(
      `INSERT OR IGNORE INTO loyalty_earn_rules (reason, points, enabled, cooldown_seconds)
       VALUES (@reason, @points, @enabled, @cooldownSeconds)`
    )
    .run({
      reason: rule.reason,
      points: rule.points,
      enabled: rule.enabled ? 1 : 0,
      cooldownSeconds: rule.cooldownSeconds
    })
}

export function upsertEarnRule(rule: LoyaltyEarnRule): void {
  getDb()
    .prepare(
      `INSERT INTO loyalty_earn_rules (reason, points, enabled, cooldown_seconds)
       VALUES (@reason, @points, @enabled, @cooldownSeconds)
       ON CONFLICT (reason) DO UPDATE SET
         points = @points, enabled = @enabled, cooldown_seconds = @cooldownSeconds`
    )
    .run({
      reason: rule.reason,
      points: rule.points,
      enabled: rule.enabled ? 1 : 0,
      cooldownSeconds: rule.cooldownSeconds
    })
}

export function listGameConfigs(): LoyaltyGameConfig[] {
  return getDb()
    .prepare<[], { game_id: string; enabled: number; config: string }>(
      'SELECT * FROM loyalty_games_config'
    )
    .all()
    .map((row) => ({
      gameId: row.game_id,
      enabled: Boolean(row.enabled),
      config: JSON.parse(row.config) as Record<string, unknown>
    }))
}

export function upsertGameConfig(
  gameId: string,
  enabled: boolean,
  config: Record<string, unknown>
): void {
  getDb()
    .prepare(
      `INSERT INTO loyalty_games_config (game_id, enabled, config)
       VALUES (@gameId, @enabled, @config)
       ON CONFLICT (game_id) DO UPDATE SET enabled = @enabled, config = @config`
    )
    .run({ gameId, enabled: enabled ? 1 : 0, config: JSON.stringify(config) })
}

/** Legt eine Default-Game-Config nur an, falls noch keine existiert. */
export function seedDefaultGameConfig(gameId: string, config: Record<string, unknown>): void {
  getDb()
    .prepare(
      `INSERT OR IGNORE INTO loyalty_games_config (game_id, enabled, config)
       VALUES (@gameId, 1, @config)`
    )
    .run({ gameId, config: JSON.stringify(config) })
}
