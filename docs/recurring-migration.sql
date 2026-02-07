-- ============================================
-- SUPABASE MIGRATION: Recurring Donation Fields
-- Run in Supabase Dashboard > SQL Editor
-- ============================================

ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS allow_recurring boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS recurring_intervals jsonb DEFAULT NULL,
ADD COLUMN IF NOT EXISTS default_recurring_interval text DEFAULT NULL;
