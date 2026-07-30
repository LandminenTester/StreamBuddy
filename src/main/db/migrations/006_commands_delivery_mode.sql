-- Zustellart für Command-Antworten: öffentlich / Erwähnung / Whisper (Version 6)

ALTER TABLE commands ADD COLUMN delivery_mode TEXT NOT NULL DEFAULT 'public'
  CHECK (delivery_mode IN ('public', 'mention', 'whisper'));
