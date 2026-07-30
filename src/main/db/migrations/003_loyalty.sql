-- Loyalty-Währungssystem (Version 3)

CREATE TABLE loyalty_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_login TEXT NOT NULL UNIQUE,
  balance INTEGER NOT NULL DEFAULT 0,
  total_earned INTEGER NOT NULL DEFAULT 0,
  total_wagered INTEGER NOT NULL DEFAULT 0,
  last_seen_at INTEGER
);

CREATE TABLE loyalty_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id INTEGER NOT NULL REFERENCES loyalty_accounts (id),
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL
    CHECK (reason IN ('follow', 'sub', 'gift_sub', 'view_time', 'game_win', 'game_loss', 'manual_adjust')),
  game_id TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE loyalty_earn_rules (
  reason TEXT PRIMARY KEY
    CHECK (reason IN ('follow', 'sub', 'gift_sub', 'view_time')),
  points INTEGER NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  cooldown_seconds INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE loyalty_games_config (
  game_id TEXT PRIMARY KEY,
  enabled INTEGER NOT NULL DEFAULT 1,
  config TEXT NOT NULL DEFAULT '{}'
);

CREATE INDEX idx_loyalty_transactions_account ON loyalty_transactions (account_id);
