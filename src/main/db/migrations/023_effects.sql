CREATE TABLE effects (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL,
  video_path TEXT,
  audio_path TEXT,
  width      INTEGER NOT NULL DEFAULT 1920,
  height     INTEGER NOT NULL DEFAULT 1080,
  created_at INTEGER NOT NULL
);
