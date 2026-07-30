-- Channel-Points-Schema (Version 2)

CREATE TABLE channel_point_rewards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  twitch_reward_id TEXT UNIQUE,
  title TEXT NOT NULL,
  cost INTEGER NOT NULL,
  prompt TEXT,
  is_enabled INTEGER NOT NULL DEFAULT 1,
  auto_fulfill INTEGER NOT NULL DEFAULT 1,
  action_type TEXT NOT NULL DEFAULT 'none'
    CHECK (action_type IN ('none', 'chat_message', 'trigger_command')),
  action_payload TEXT,
  background_color TEXT,
  synced_at INTEGER,
  created_at INTEGER NOT NULL
);

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

CREATE INDEX idx_redemption_log_reward ON redemption_log (reward_id);
