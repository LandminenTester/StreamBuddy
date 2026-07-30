-- Basis-Schema: Auth, Commands, Automessages, Polls, Stats
-- Migration-Runner nutzt PRAGMA user_version; diese Datei entspricht Version 1.

CREATE TABLE auth_tokens (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  twitch_user_id TEXT NOT NULL,
  twitch_login TEXT NOT NULL,
  access_token_enc BLOB NOT NULL,
  refresh_token_enc BLOB NOT NULL,
  scopes TEXT NOT NULL DEFAULT '[]',
  expires_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE feature_scopes (
  feature_key TEXT PRIMARY KEY,
  required_scopes TEXT NOT NULL DEFAULT '[]',
  enabled INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE commands (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trigger TEXT NOT NULL UNIQUE,
  response TEXT NOT NULL,
  aliases TEXT NOT NULL DEFAULT '[]',
  permission_level TEXT NOT NULL DEFAULT 'everyone'
    CHECK (permission_level IN ('everyone', 'subscriber', 'moderator', 'broadcaster')),
  cooldown_seconds INTEGER NOT NULL DEFAULT 5,
  enabled INTEGER NOT NULL DEFAULT 1,
  use_count INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE automessages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  messages TEXT NOT NULL DEFAULT '[]',
  mode TEXT NOT NULL DEFAULT 'interval'
    CHECK (mode IN ('interval', 'message_count')),
  interval_minutes INTEGER,
  message_count_threshold INTEGER,
  min_chat_lines_since_last INTEGER NOT NULL DEFAULT 0,
  enabled INTEGER NOT NULL DEFAULT 1,
  last_sent_at INTEGER,
  created_at INTEGER NOT NULL
);

CREATE TABLE polls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  twitch_poll_id TEXT UNIQUE,
  title TEXT NOT NULL,
  choices TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'completed', 'terminated', 'archived')),
  duration_seconds INTEGER NOT NULL,
  channel_points_voting_enabled INTEGER NOT NULL DEFAULT 0,
  channel_points_per_vote INTEGER DEFAULT 0,
  started_at INTEGER,
  ended_at INTEGER,
  created_at INTEGER NOT NULL
);

CREATE TABLE chat_message_stats (
  bucket_start INTEGER PRIMARY KEY,
  message_count INTEGER NOT NULL DEFAULT 0,
  unique_chatters INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE viewer_count_samples (
  sampled_at INTEGER PRIMARY KEY,
  viewer_count INTEGER NOT NULL,
  stream_id TEXT
);

CREATE TABLE follow_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_login TEXT NOT NULL,
  followed_at INTEGER NOT NULL
);

CREATE INDEX idx_viewer_samples_stream ON viewer_count_samples (stream_id);
