import { getDb } from '../connection'
import type {
  LoyaltyAccount,
  LoyaltyEarnRule,
  LoyaltyGameConfig,
  LoyaltyGameHistoryEntry,
  LoyaltyGameStats,
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
  is_blacklisted: number
}

function accountToDomain(row: AccountRow): LoyaltyAccount {
  return {
    id: row.id,
    userLogin: row.user_login,
    balance: row.balance,
    totalEarned: row.total_earned,
    totalWagered: row.total_wagered,
    lastSeenAt: row.last_seen_at,
    isBlacklisted: Boolean(row.is_blacklisted)
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

interface TransactionRow {
  id: number
  account_id: number
  amount: number
  reason: LoyaltyTransactionReason
  game_id: string | null
  created_at: number
  user_login: string
}

function transactionRowToDomain(row: TransactionRow): LoyaltyGameHistoryEntry {
  return {
    id: row.id,
    accountId: row.account_id,
    amount: row.amount,
    reason: row.reason,
    gameId: row.game_id,
    createdAt: row.created_at,
    userLogin: row.user_login
  }
}

/** Verlauf der letzten Transaktionen eines Games (Wins/Losses) inkl. Nutzername, neueste zuerst. */
export function listTransactionsByGame(gameId: string, limit = 50): LoyaltyGameHistoryEntry[] {
  return getDb()
    .prepare<[string, number], TransactionRow>(
      `SELECT t.*, a.user_login
       FROM loyalty_transactions t
       JOIN loyalty_accounts a ON a.id = t.account_id
       WHERE t.game_id = ?
       ORDER BY t.created_at DESC LIMIT ?`
    )
    .all(gameId, limit)
    .map(transactionRowToDomain)
}

/** Aggregierte Win/Loss-Statistik eines Games über die gesamte Historie. */
export function getGameStats(gameId: string): LoyaltyGameStats {
  const rows = getDb()
    .prepare<[string], { reason: LoyaltyTransactionReason; count: number; total: number }>(
      `SELECT reason, COUNT(*) as count, SUM(ABS(amount)) as total
       FROM loyalty_transactions
       WHERE game_id = ? AND reason IN ('game_win', 'game_loss')
       GROUP BY reason`
    )
    .all(gameId)

  const win = rows.find((r) => r.reason === 'game_win')
  const loss = rows.find((r) => r.reason === 'game_loss')
  const winCount = win?.count ?? 0
  const lossCount = loss?.count ?? 0
  const totalRounds = winCount + lossCount

  return {
    gameId,
    winCount,
    lossCount,
    totalWon: win?.total ?? 0,
    totalLost: loss?.total ?? 0,
    actualWinRatePercent: totalRounds > 0 ? Math.round((winCount / totalRounds) * 1000) / 10 : 0
  }
}

export function getLeaderboard(limit = 25): LoyaltyLeaderboardEntry[] {
  const rows = getDb()
    .prepare<[number], AccountRow>(
      'SELECT * FROM loyalty_accounts WHERE is_blacklisted = 0 ORDER BY balance DESC LIMIT ?'
    )
    .all(limit)

  return rows.map((row, index) => ({
    userLogin: row.user_login,
    balance: row.balance,
    rank: index + 1
  }))
}

/** Alle nicht geblacklisteten Loyalty-Konten ohne Limit -- für CSV-Export und "an alle"-Massenaktionen. */
export function listAllAccounts(): LoyaltyAccount[] {
  return getDb()
    .prepare<[], AccountRow>(
      'SELECT * FROM loyalty_accounts WHERE is_blacklisted = 0 ORDER BY balance DESC'
    )
    .all()
    .map(accountToDomain)
}

/** Nur die geblacklisteten Konten -- tauchen sonst nirgends mehr auf, daher eigene Liste. */
export function listBlacklistedAccounts(): LoyaltyAccount[] {
  return getDb()
    .prepare<[], AccountRow>(
      'SELECT * FROM loyalty_accounts WHERE is_blacklisted = 1 ORDER BY user_login ASC'
    )
    .all()
    .map(accountToDomain)
}

export function setAccountBlacklisted(userLogin: string, blacklisted: boolean): void {
  if (blacklisted) {
    getOrCreateAccount(userLogin)
  }

  getDb()
    .prepare('UPDATE loyalty_accounts SET is_blacklisted = ? WHERE user_login = ?')
    .run(blacklisted ? 1 : 0, userLogin.toLowerCase())
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

interface GameConfigRow {
  game_id: string
  enabled: number
  config: string
  display_name: string | null
  command_triggers: string
  texts: string
}

function gameConfigRowToDomain(row: GameConfigRow): LoyaltyGameConfig {
  return {
    gameId: row.game_id,
    enabled: Boolean(row.enabled),
    config: JSON.parse(row.config) as Record<string, unknown>,
    displayName: row.display_name,
    commandTriggers: JSON.parse(row.command_triggers) as Record<string, string>,
    texts: JSON.parse(row.texts) as Record<string, string[]>
  }
}

export function listGameConfigs(): LoyaltyGameConfig[] {
  return getDb()
    .prepare<[], GameConfigRow>('SELECT * FROM loyalty_games_config')
    .all()
    .map(gameConfigRowToDomain)
}

export function upsertGameConfig(
  gameId: string,
  enabled: boolean,
  config: Record<string, unknown>,
  displayName?: string | null,
  commandTriggers?: Record<string, string>,
  texts?: Record<string, string[]>
): void {
  const existing = listGameConfigs().find((c) => c.gameId === gameId)
  const resolvedDisplayName =
    displayName !== undefined ? displayName : (existing?.displayName ?? null)
  const resolvedTriggers =
    commandTriggers !== undefined ? commandTriggers : (existing?.commandTriggers ?? {})
  const resolvedTexts = texts !== undefined ? texts : (existing?.texts ?? {})

  getDb()
    .prepare(
      `INSERT INTO loyalty_games_config (game_id, enabled, config, display_name, command_triggers, texts)
       VALUES (@gameId, @enabled, @config, @displayName, @commandTriggers, @texts)
       ON CONFLICT (game_id) DO UPDATE SET
         enabled = @enabled, config = @config, display_name = @displayName,
         command_triggers = @commandTriggers, texts = @texts`
    )
    .run({
      gameId,
      enabled: enabled ? 1 : 0,
      config: JSON.stringify(config),
      displayName: resolvedDisplayName,
      commandTriggers: JSON.stringify(resolvedTriggers),
      texts: JSON.stringify(resolvedTexts)
    })
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
