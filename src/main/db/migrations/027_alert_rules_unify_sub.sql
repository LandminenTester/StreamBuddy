-- Sub-Tiers und Gift-Subs werden zu einer einzigen 'sub'-Regel zusammengelegt (Text-Varianten
-- pro Tier/Schwelle leben jetzt im text-JSON statt separater Regelzeilen). Bestehende sub/gift_sub-
-- Zeilen werden ersatzlos entfernt, da der Alert Manager gerade erst eingefuehrt wurde und die
-- alten Werte nicht automatisiert in die neue Text-Struktur ueberfuehrt werden koennen.
DELETE FROM alert_rules WHERE event_type IN ('sub', 'gift_sub');

ALTER TABLE alert_rules RENAME TO alert_rules_legacy;

CREATE TABLE alert_rules (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT    NOT NULL CHECK (event_type IN ('follow', 'sub', 'raid')),
  condition  TEXT,
  media      TEXT    NOT NULL,
  audio      TEXT    NOT NULL,
  text       TEXT    NOT NULL,
  effect_id  INTEGER REFERENCES effects (id),
  enabled    INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

INSERT INTO alert_rules
  (id, event_type, condition, media, audio, text, effect_id, enabled, created_at, updated_at)
SELECT id, event_type, condition, media, audio, text, effect_id, enabled, created_at, updated_at
FROM alert_rules_legacy;

DROP TABLE alert_rules_legacy;

CREATE INDEX idx_alert_rules_event_type ON alert_rules (event_type);
