-- Viewer-Session-Tracking: Streams, Spielabschnitte, Chat-Präsenz-Sessions
-- Migration-Runner nutzt PRAGMA user_version; diese Datei entspricht Version 12.

CREATE TABLE streams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stream_id TEXT NOT NULL UNIQUE,
  channel_login TEXT NOT NULL,
  started_at INTEGER NOT NULL,
  ended_at INTEGER,
  peak_viewer_count INTEGER NOT NULL DEFAULT 0,
  game_name TEXT,
  stream_title TEXT
);

CREATE TABLE stream_game_segments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stream_id TEXT NOT NULL,
  game_name TEXT NOT NULL,
  started_at INTEGER NOT NULL,
  ended_at INTEGER
);

CREATE TABLE viewer_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stream_id TEXT NOT NULL,
  user_login TEXT NOT NULL,
  joined_at INTEGER NOT NULL,
  left_at INTEGER
);

CREATE INDEX idx_vs_stream ON viewer_sessions (stream_id);
CREATE INDEX idx_vs_user   ON viewer_sessions (user_login);
CREATE INDEX idx_streams_started ON streams (started_at DESC);
