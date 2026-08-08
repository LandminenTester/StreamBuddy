CREATE TABLE alert_rules (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT    NOT NULL CHECK (event_type IN ('follow', 'sub', 'gift_sub', 'raid')),
  condition  TEXT,
  media      TEXT    NOT NULL,
  audio      TEXT    NOT NULL,
  text       TEXT    NOT NULL,
  effect_id  INTEGER REFERENCES effects (id),
  enabled    INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX idx_alert_rules_event_type ON alert_rules (event_type);
