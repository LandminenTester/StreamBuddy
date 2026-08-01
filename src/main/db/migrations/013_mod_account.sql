-- Optionaler Mod-Account für Commands, Automessages und Loyalty-Games.
-- Gleiche Struktur wie auth_tokens, aber als separate Tabelle damit klar getrennt
-- und eine Zeile nie verwechselt wird (id=1 in beiden Tabellen wäre sonst mehrdeutig).
CREATE TABLE mod_account_tokens (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  twitch_user_id TEXT NOT NULL,
  twitch_login TEXT NOT NULL,
  access_token_enc BLOB NOT NULL,
  refresh_token_enc BLOB NOT NULL,
  scopes TEXT NOT NULL DEFAULT '[]',
  expires_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
