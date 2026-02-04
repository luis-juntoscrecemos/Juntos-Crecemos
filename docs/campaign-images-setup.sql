-- ============================================
-- SUPABASE SETUP: Campaign Images Storage & View Update
-- For Juntos Crecemos Campaign Image Upload Feature
-- ============================================
-- Run this in Supabase Dashboard > SQL Editor

-- ============================================
-- 1. ADD IMAGE_URL COLUMN TO CAMPAIGNS TABLE (if not exists)
-- ============================================

ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS image_url TEXT;

-- ============================================
-- 2. CREATE STORAGE BUCKET FOR CAMPAIGN IMAGES
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'campaign-images',
  'campaign-images',
  true,  -- Public bucket so images can be displayed
  2097152,  -- 2MB limit
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 3. STORAGE POLICIES FOR CAMPAIGN-IMAGES BUCKET
-- ============================================

-- Policy: Allow anyone to read/download campaign images (public)
CREATE POLICY "Anyone can view campaign images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'campaign-images');

-- Policy: Allow authenticated service role to upload (backend uses service_role key)
-- The backend uses SUPABASE_SERVICE_ROLE_KEY which bypasses RLS
-- No explicit INSERT policy needed for service_role

-- ============================================
-- 4. UPDATE CAMPAIGNS_WITH_TOTALS VIEW
-- ============================================
-- This view needs to include the image_url column

-- First, drop the existing view
DROP VIEW IF EXISTS campaigns_with_totals;

-- Recreate the view with image_url included
CREATE OR REPLACE VIEW campaigns_with_totals AS
SELECT 
  c.id,
  c.org_id,
  c.title,
  c.slug,
  c.description,
  c.goal_amount,
  c.currency,
  c.is_active,
  c.image_url,
  c.suggested_amounts,
  c.created_at,
  c.updated_at,
  COALESCE(SUM(d.amount_minor), 0) AS raised_minor,
  COUNT(d.id) AS donations_count
FROM campaigns c
LEFT JOIN donations d ON d.campaign_id = c.id AND d.status = 'completed'
GROUP BY c.id, c.org_id, c.title, c.slug, c.description, c.goal_amount, c.currency, c.is_active, c.image_url, c.suggested_amounts, c.created_at, c.updated_at;

-- ============================================
-- NOTES:
-- ============================================
-- After running this SQL:
-- 1. The campaign-images bucket will be created
-- 2. The image_url column will be added to campaigns table
-- 3. The campaigns_with_totals view will include image_url
-- 4. Images uploaded through the app will be stored and displayed correctly
