ALTER TABLE command_trackers ADD COLUMN type TEXT NOT NULL DEFAULT 'counter';
ALTER TABLE command_trackers ADD COLUMN text_value TEXT;
