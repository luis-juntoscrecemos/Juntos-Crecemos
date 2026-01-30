-- ============================================
-- SUPABASE SETUP: Storage Bucket & RLS Policies
-- For Juntos Crecemos Organization Registration
-- ============================================

-- ============================================
-- 1. CREATE STORAGE BUCKET FOR ORG LOGOS
-- ============================================
-- Run in Supabase Dashboard > Storage > Create bucket
-- Or via SQL:

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'org-logos',
  'org-logos',
  true,  -- Public bucket so logos can be displayed
  2097152,  -- 2MB limit
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. STORAGE POLICIES FOR ORG-LOGOS BUCKET
-- ============================================

-- Policy: Allow authenticated users to upload to their org's folder
CREATE POLICY "Organizations can upload their own logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'org-logos' 
  AND (storage.foldername(name))[1] IN (
    SELECT o.id::text FROM organizations o
    JOIN organization_users ou ON o.id = ou.organization_id
    WHERE ou.user_id = auth.uid()
  )
);

-- Policy: Allow authenticated users to update their org's logo
CREATE POLICY "Organizations can update their own logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'org-logos'
  AND (storage.foldername(name))[1] IN (
    SELECT o.id::text FROM organizations o
    JOIN organization_users ou ON o.id = ou.organization_id
    WHERE ou.user_id = auth.uid()
  )
);

-- Policy: Allow anyone to read/download org logos (public)
CREATE POLICY "Anyone can view org logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'org-logos');

-- ============================================
-- 3. RLS POLICIES FOR ORGANIZATIONS TABLE
-- ============================================

-- Enable RLS on organizations table if not already
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can do everything (backend uses service_role key)
-- This is automatically granted to service_role, no explicit policy needed

-- Policy: Allow users to read their own organization
CREATE POLICY "Users can read their organization"
ON organizations FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT organization_id FROM organization_users
    WHERE user_id = auth.uid()
  )
);

-- Policy: Allow users to update their own organization
CREATE POLICY "Users can update their organization"
ON organizations FOR UPDATE
TO authenticated
USING (
  id IN (
    SELECT organization_id FROM organization_users
    WHERE user_id = auth.uid()
  )
);

-- Policy: Allow insert during signup (via service_role from backend)
-- The backend uses service_role key which bypasses RLS
-- No explicit policy needed for inserts from backend

-- ============================================
-- 4. RLS POLICIES FOR ORGANIZATION_USERS TABLE
-- ============================================

ALTER TABLE organization_users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own org membership
CREATE POLICY "Users can read their org membership"
ON organization_users FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- ============================================
-- 5. COLUMN ADDITIONS (if needed)
-- ============================================
-- These columns should already exist based on the schema,
-- but if missing, run:

-- ALTER TABLE organizations ADD COLUMN IF NOT EXISTS logo_url TEXT;
-- ALTER TABLE organizations ADD COLUMN IF NOT EXISTS website TEXT;
-- ALTER TABLE organizations ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- ============================================
-- NOTES:
-- ============================================
-- 1. The backend (Express) uses SUPABASE_SERVICE_ROLE_KEY which bypasses RLS.
--    This allows the registration endpoint to create orgs and org_users.
--
-- 2. The frontend uses SUPABASE_ANON_KEY for auth only.
--    All data operations go through the Express backend.
--
-- 3. Storage uploads happen from the backend using service_role key.
--
-- 4. For logo updates from the Organization page, the backend validates
--    ownership before allowing updates.
