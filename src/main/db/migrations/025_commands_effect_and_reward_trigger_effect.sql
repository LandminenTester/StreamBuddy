-- Commands koennen einen Effekt auslösen.
ALTER TABLE commands ADD COLUMN effect_id INTEGER REFERENCES effects (id);

-- Channel-Points-Rewards: 'trigger_effect' als neue Aktion erlauben. SQLite kennt kein
-- ALTER ... DROP CONSTRAINT, daher wird die Tabelle neu gebaut (gleiches Vorgehen wie in
-- 017_channel_points_loyalty_exchange.sql).
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
    CHECK (action_type IN ('none', 'chat_message', 'trigger_command', 'loyalty_exchange', 'trigger_effect')),
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

DROP TABLE channel_point_rewards_legacy;
