CREATE TABLE greeted_users (
  stream_id TEXT NOT NULL,
  login TEXT NOT NULL,
  greeted_at INTEGER NOT NULL,
  PRIMARY KEY (stream_id, login)
);

CREATE INDEX idx_greeted_users_stream_id ON greeted_users (stream_id);
