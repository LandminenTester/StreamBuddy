CREATE TABLE command_trackers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  label TEXT NOT NULL,
  value INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

ALTER TABLE commands ADD COLUMN tracker_id INTEGER;
ALTER TABLE commands ADD COLUMN tracker_action TEXT;
