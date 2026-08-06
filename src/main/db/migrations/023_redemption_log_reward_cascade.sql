-- redemption_log.reward_id hatte keine ON DELETE-Regel -- das Loeschen eines Rewards mit
-- vorhandener Redemption-Historie schlug mit "FOREIGN KEY constraint failed" fehl. Die
-- Repository-Queries (listRecentRedemptions, getRedemptionByTwitchId) joinen bereits per
-- LEFT JOIN und behandeln eine fehlende Reward-Zuordnung als erwarteten Fall (reward_title
-- bleibt leer) -- die Historie soll beim Loeschen eines Rewards erhalten bleiben, nur die
-- Verknuepfung wird aufgeloest.

ALTER TABLE redemption_log RENAME TO redemption_log_pre_cascade;

CREATE TABLE redemption_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reward_id INTEGER REFERENCES channel_point_rewards (id) ON DELETE SET NULL,
  twitch_redemption_id TEXT NOT NULL,
  user_login TEXT NOT NULL,
  user_input TEXT,
  status TEXT NOT NULL DEFAULT 'unfulfilled'
    CHECK (status IN ('unfulfilled', 'fulfilled', 'canceled')),
  redeemed_at INTEGER NOT NULL,
  action_processed_at INTEGER
);

INSERT INTO redemption_log
  (id, reward_id, twitch_redemption_id, user_login, user_input, status, redeemed_at, action_processed_at)
SELECT id, reward_id, twitch_redemption_id, user_login, user_input, status, redeemed_at, action_processed_at
FROM redemption_log_pre_cascade;

DROP TABLE redemption_log_pre_cascade;

CREATE INDEX idx_redemption_log_reward ON redemption_log (reward_id);
