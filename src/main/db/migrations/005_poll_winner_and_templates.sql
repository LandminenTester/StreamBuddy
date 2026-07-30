-- Manuelle Gewinnerauswahl für Umfragen + Umfrage-Templates (Version 5)

ALTER TABLE polls ADD COLUMN winner_choice_index INTEGER;

CREATE TABLE poll_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  choices TEXT NOT NULL DEFAULT '[]',
  duration_seconds INTEGER NOT NULL,
  channel_points_voting_enabled INTEGER NOT NULL DEFAULT 0,
  channel_points_per_vote INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL
);
