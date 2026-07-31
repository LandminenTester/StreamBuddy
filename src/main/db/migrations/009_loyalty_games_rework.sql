-- Konfigurierbare Command-Trigger/Texte pro Game, Bot-Nachrichtensets, Roulette-Rundenlog (Version 9)

ALTER TABLE loyalty_games_config ADD COLUMN command_triggers TEXT NOT NULL DEFAULT '{}';
ALTER TABLE loyalty_games_config ADD COLUMN texts TEXT NOT NULL DEFAULT '{}';

-- Generische, erweiterbare Textmengen fuer Bot-Ansagen ausserhalb eines einzelnen Games
-- (aktuell: Loyalty-"geschlossen"-Meldungen), Format wie automessages.messages (JSON-Array).
CREATE TABLE bot_message_sets (
  key TEXT PRIMARY KEY,
  messages TEXT NOT NULL DEFAULT '[]'
);

-- Rundenergebnisse fuer Roulette, unabhaengig davon ob ueberhaupt gewettet wurde
-- (fuer den Farbverlauf-Befehl und Statistik).
CREATE TABLE roulette_rounds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  winning_color TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_loyalty_transactions_game ON loyalty_transactions (game_id, created_at);
