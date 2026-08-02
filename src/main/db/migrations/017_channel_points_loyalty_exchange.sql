-- Erlaubt Loyalty-Punkte als Aktion eines Channel-Points-Rewards.

ALTER TABLE redemption_log RENAME TO redemption_log_legacy;
ALTER TABLE channel_point_rewards RENAME TO channel_point_rewards_legacy;

CREATE TABLE channel_point_rewards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  twitch_reward_id TEXT UNIQUE,
  title TEXT NOT NULL,
  cost INTEGER NOT NULL,
  prompt TEXT,
  is_enabled INTEGER NOT NULL DEFAULT 1,
  auto_fulfill INTEGER NOT NULL DEFAULT 1,
  action_type TEXT NOT NULL DEFAULT 'none'
    CHECK (action_type IN ('none', 'chat_message', 'trigger_command', 'loyalty_exchange')),
  action_payload TEXT,
  background_color TEXT,
  synced_at INTEGER,
  created_at INTEGER NOT NULL
);

INSERT INTO channel_point_rewards
  (id, twitch_reward_id, title, cost, prompt, is_enabled, auto_fulfill, action_type,
   action_payload, background_color, synced_at, created_at)
SELECT id, twitch_reward_id, title, cost, prompt, is_enabled, auto_fulfill, action_type,
       action_payload, background_color, synced_at, created_at
FROM channel_point_rewards_legacy;

CREATE TABLE redemption_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reward_id INTEGER REFERENCES channel_point_rewards (id),
  twitch_redemption_id TEXT NOT NULL,
  user_login TEXT NOT NULL,
  user_input TEXT,
  status TEXT NOT NULL DEFAULT 'unfulfilled'
    CHECK (status IN ('unfulfilled', 'fulfilled', 'canceled')),
  redeemed_at INTEGER NOT NULL
);

INSERT INTO redemption_log
  (id, reward_id, twitch_redemption_id, user_login, user_input, status, redeemed_at)
SELECT id, reward_id, twitch_redemption_id, user_login, user_input, status, redeemed_at
FROM redemption_log_legacy;

DROP TABLE redemption_log_legacy;
DROP TABLE channel_point_rewards_legacy;

CREATE INDEX idx_redemption_log_reward ON redemption_log (reward_id);
