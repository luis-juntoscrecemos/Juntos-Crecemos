-- ============================================
-- FIX UNRESTRICTED RLS ON VIEWS AND TABLES
-- ============================================
-- This migration enables RLS on objects flagged as "Unrestricted" in Supabase.
-- Since all app data access goes through the Express API using the service_role key
-- (which bypasses RLS), we simply enable RLS with no permissive policies.
-- This locks these objects down so they're only accessible via the service_role key.

-- 1. campaigns_with_totals (VIEW)
-- Used by the Express API to list campaigns with raised amounts.
ALTER VIEW campaigns_with_totals SET (security_invoker = on);

-- 2. donations_with_org (VIEW)
-- Used by the Express API for donor dashboard donation listings.
ALTER VIEW donations_with_org SET (security_invoker = on);

-- 3. causes (TABLE)
-- If this table exists and is unused (causes are stored as text[] on organizations),
-- enable RLS to lock it down.
ALTER TABLE IF EXISTS causes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- NOTES
-- ============================================
-- After running this SQL in the Supabase SQL Editor:
-- 1. campaigns_with_totals and donations_with_org views will inherit RLS
--    from their underlying tables (using security_invoker = on).
--    The service_role key bypasses RLS, so the Express API continues to work.
-- 2. The causes table will have RLS enabled with no policies, making it
--    accessible only via service_role.
-- 3. All three objects should no longer appear as "Unrestricted" in the
--    Supabase dashboard.
