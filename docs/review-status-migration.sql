-- Migration: Add organization review workflow
-- Run this in your Supabase SQL Editor

-- 1) Add review columns to organizations table (defaults set for existing rows)
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS review_status text NOT NULL DEFAULT 'APPROVED',
  ADD COLUMN IF NOT EXISTS reviewed_by uuid NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS review_notes text NULL,
  ADD COLUMN IF NOT EXISTS can_receive_donations boolean NOT NULL DEFAULT true;

-- 2) Ensure all existing organizations are explicitly APPROVED
UPDATE organizations
SET review_status = 'APPROVED',
    can_receive_donations = true
WHERE review_status = 'APPROVED';

-- 3) Change defaults so NEW orgs start as PENDING
ALTER TABLE organizations
  ALTER COLUMN review_status SET DEFAULT 'PENDING',
  ALTER COLUMN can_receive_donations SET DEFAULT false;

-- 4) Add constraint for review_status values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'organizations_review_status_check'
  ) THEN
    ALTER TABLE organizations
      ADD CONSTRAINT organizations_review_status_check
      CHECK (review_status IN ('PENDING', 'APPROVED', 'REJECTED'));
  END IF;
END $$;
