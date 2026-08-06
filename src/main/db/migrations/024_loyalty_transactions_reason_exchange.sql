-- Erweitert die reason-CHECK-Constraint um 'channel_point_exchange' (Loyalty-Gutschrift aus
-- Channel-Points-Redemptions, seit Migration 017 als Reward-Aktion moeglich, aber hier vergessen).

ALTER TABLE loyalty_transactions RENAME TO loyalty_transactions_legacy;

CREATE TABLE loyalty_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id INTEGER NOT NULL REFERENCES loyalty_accounts (id),
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL
    CHECK (reason IN ('follow', 'sub', 'gift_sub', 'view_time', 'game_win', 'game_loss',
                       'manual_adjust', 'channel_point_exchange')),
  game_id TEXT,
  created_at INTEGER NOT NULL
);

INSERT INTO loyalty_transactions
  (id, account_id, amount, reason, game_id, created_at)
SELECT id, account_id, amount, reason, game_id, created_at
FROM loyalty_transactions_legacy;

DROP TABLE loyalty_transactions_legacy;

CREATE INDEX idx_loyalty_transactions_account ON loyalty_transactions (account_id);
