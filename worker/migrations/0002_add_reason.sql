-- Terse public cause of the CURRENT down state ("HTTP 503", "Timed out",
-- "Unreachable"), written by every probe: a value while down, NULL while up.
-- Latest-state only - day buckets carry no reasons.
ALTER TABLE service_status ADD COLUMN reason TEXT;
