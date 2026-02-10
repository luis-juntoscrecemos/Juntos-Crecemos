-- ============================================
-- SUPABASE MIGRATION: Short Transaction IDs
-- Run in Supabase Dashboard > SQL Editor
-- ============================================

-- Add short_id to donations with unique constraint
ALTER TABLE donations
ADD COLUMN IF NOT EXISTS short_id text UNIQUE;

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_donations_short_id ON donations(short_id);

-- Add short_id to donation_intents with unique constraint
ALTER TABLE donation_intents
ADD COLUMN IF NOT EXISTS short_id text UNIQUE;

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_donation_intents_short_id ON donation_intents(short_id);
