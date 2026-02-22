-- Add causes column to organizations table
-- Run this in Supabase Dashboard SQL Editor

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS causes text[] DEFAULT NULL;
