CREATE TABLE activity_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL
    CHECK (event_type IN ('follow', 'sub', 'resub', 'gift_sub', 'bits', 'raid', 'channel_points')),
  twitch_event_id TEXT UNIQUE,
  actor_login TEXT,
  actor_display_name TEXT,
  target_login TEXT,
  summary TEXT NOT NULL,
  payload TEXT,
  occurred_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_activity_events_occurred_at ON activity_events (occurred_at);
CREATE INDEX idx_activity_events_type ON activity_events (event_type);
CREATE INDEX idx_activity_events_actor ON activity_events (actor_login);
