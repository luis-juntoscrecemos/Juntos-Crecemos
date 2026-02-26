-- Migration: Fix campaign slug uniqueness constraint
-- Campaign slugs should be unique per organization, not globally.
-- This allows every org to have its own 'donacion-general' default campaign.
-- Run this in the Supabase SQL Editor.

-- Step 1: Drop the global unique constraint on slug
ALTER TABLE campaigns DROP CONSTRAINT IF EXISTS campaigns_slug_key;

-- Step 2: Add composite unique constraint on (org_id, slug)
ALTER TABLE campaigns ADD CONSTRAINT campaigns_org_slug_unique UNIQUE (org_id, slug);
