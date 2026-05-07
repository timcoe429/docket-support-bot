-- Run in Neon SQL editor (one-time)
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS contact_full_name TEXT;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS business_name TEXT;
