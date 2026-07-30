-- Generischer Key-Value-Store für App-weite Einstellungen (Version 4)
-- z.B. 'target_channel' (Twitch-Channel, dem der Bot beitritt)

CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value TEXT
);
