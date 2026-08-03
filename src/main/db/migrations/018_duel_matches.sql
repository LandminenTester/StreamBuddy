CREATE TABLE loyalty_duel_matches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  challenger_login TEXT NOT NULL,
  opponent_login TEXT NOT NULL,
  winner_login TEXT NOT NULL,
  loser_login TEXT NOT NULL,
  amount INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_duel_matches_created_at ON loyalty_duel_matches (created_at);
