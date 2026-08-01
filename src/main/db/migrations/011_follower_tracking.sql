-- Follower-Tracking: vollständige Followerliste + Verlaufshistorie
-- Migration-Runner nutzt PRAGMA user_version; diese Datei entspricht Version 11.

CREATE TABLE followers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL UNIQUE,
  user_login TEXT NOT NULL,
  display_name TEXT,
  followed_at INTEGER NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  synced_at INTEGER NOT NULL
);

CREATE TABLE follower_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  user_login TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('follow', 'unfollow')),
  event_at INTEGER NOT NULL,
  follow_duration_seconds INTEGER
);

CREATE TABLE follower_sync_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  synced_at INTEGER NOT NULL DEFAULT (unixepoch()),
  total_count INTEGER NOT NULL,
  new_count INTEGER NOT NULL,
  lost_count INTEGER NOT NULL
);

CREATE INDEX idx_followers_active ON followers (is_active);
CREATE INDEX idx_follower_history_user ON follower_history (user_id);
