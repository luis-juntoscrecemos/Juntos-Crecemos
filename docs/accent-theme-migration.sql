-- Migration: Add accent_theme column to organizations
-- Run this in the Supabase SQL Editor

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS accent_theme text DEFAULT 'classic';
