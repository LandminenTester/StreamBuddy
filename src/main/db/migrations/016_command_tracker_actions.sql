ALTER TABLE commands ADD COLUMN tracker_actions TEXT NOT NULL DEFAULT '[]';

UPDATE commands
SET tracker_actions = json_array(json_object('trackerId', tracker_id, 'action', tracker_action))
WHERE tracker_id IS NOT NULL
  AND tracker_action IN ('increment', 'decrement');
