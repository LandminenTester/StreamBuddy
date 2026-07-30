-- Blacklist für Loyalty-Konten (z.B. Bots): kein Earn, keine Rangliste, keine Games (Version 7)

ALTER TABLE loyalty_accounts ADD COLUMN is_blacklisted INTEGER NOT NULL DEFAULT 0;
