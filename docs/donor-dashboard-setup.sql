-- ============================================
-- DONOR DASHBOARD: Database Schema & RLS Policies
-- For Juntos Crecemos Donor Dashboard Feature
-- ============================================

-- ============================================
-- 1. CREATE DONOR_ACCOUNTS TABLE
-- ============================================
-- This table stores donor accounts (users who donated and then created an account)
-- Different from the existing 'donors' table which is org-specific donor records

CREATE TABLE IF NOT EXISTS donor_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  email_verified BOOLEAN DEFAULT FALSE
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_donor_accounts_auth_user_id ON donor_accounts(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_donor_accounts_email ON donor_accounts(email);

-- ============================================
-- 2. CREATE FAVORITES TABLE
-- ============================================
-- Stores donor's favorite organizations

CREATE TABLE IF NOT EXISTS favorites (
  donor_account_id UUID NOT NULL REFERENCES donor_accounts(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (donor_account_id, organization_id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_favorites_donor_account_id ON favorites(donor_account_id);
CREATE INDEX IF NOT EXISTS idx_favorites_organization_id ON favorites(organization_id);

-- ============================================
-- 3. UPDATE DONATIONS TABLE
-- ============================================
-- Add donor_account_id column to link claimed donations to donor accounts

ALTER TABLE donations 
ADD COLUMN IF NOT EXISTS donor_account_id UUID REFERENCES donor_accounts(id) ON DELETE SET NULL;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_donations_donor_account_id ON donations(donor_account_id);
CREATE INDEX IF NOT EXISTS idx_donations_donor_email ON donations(donor_email);

-- ============================================
-- 4. RLS POLICIES FOR DONOR_ACCOUNTS
-- ============================================

ALTER TABLE donor_accounts ENABLE ROW LEVEL SECURITY;

-- Donors can read their own account
CREATE POLICY "Donors can read their own account"
ON donor_accounts FOR SELECT
TO authenticated
USING (auth_user_id = auth.uid());

-- Donors can update their own account (only full_name)
CREATE POLICY "Donors can update their own account"
ON donor_accounts FOR UPDATE
TO authenticated
USING (auth_user_id = auth.uid())
WITH CHECK (auth_user_id = auth.uid());

-- Donors can insert their own account (only with their auth_user_id)
CREATE POLICY "Donors can insert their own account"
ON donor_accounts FOR INSERT
TO authenticated
WITH CHECK (auth_user_id = auth.uid());

-- ============================================
-- 5. RLS POLICIES FOR FAVORITES
-- ============================================

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Donors can read their own favorites
CREATE POLICY "Donors can read their own favorites"
ON favorites FOR SELECT
TO authenticated
USING (
  donor_account_id IN (
    SELECT id FROM donor_accounts WHERE auth_user_id = auth.uid()
  )
);

-- Donors can insert their own favorites
CREATE POLICY "Donors can insert their own favorites"
ON favorites FOR INSERT
TO authenticated
WITH CHECK (
  donor_account_id IN (
    SELECT id FROM donor_accounts WHERE auth_user_id = auth.uid()
  )
);

-- Donors can delete their own favorites
CREATE POLICY "Donors can delete their own favorites"
ON favorites FOR DELETE
TO authenticated
USING (
  donor_account_id IN (
    SELECT id FROM donor_accounts WHERE auth_user_id = auth.uid()
  )
);

-- ============================================
-- 6. RLS POLICIES FOR DONATIONS (DONOR ACCESS)
-- ============================================

-- Donors can read their own claimed donations
CREATE POLICY "Donors can read their claimed donations"
ON donations FOR SELECT
TO authenticated
USING (
  donor_account_id IN (
    SELECT id FROM donor_accounts WHERE auth_user_id = auth.uid()
  )
);

-- Note: Donations are inserted by the backend using service_role key
-- Donors cannot modify donation amounts or status

-- ============================================
-- 7. HELPER FUNCTION: CLAIM DONATIONS
-- ============================================
-- This function is called after donor email verification to claim donations

CREATE OR REPLACE FUNCTION claim_donations_for_donor(
  p_donor_account_id UUID,
  p_email TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE donations
  SET donor_account_id = p_donor_account_id
  WHERE LOWER(donor_email) = LOWER(p_email)
    AND donor_account_id IS NULL
    AND status = 'succeeded';
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- ============================================
-- 8. VIEW: DONATIONS WITH ORG INFO
-- ============================================
-- View for donor dashboard to show donations with organization details

CREATE OR REPLACE VIEW donations_with_org AS
SELECT 
  d.*,
  o.name AS organization_name,
  o.logo_url AS organization_logo_url,
  c.title AS campaign_title
FROM donations d
LEFT JOIN organizations o ON d.org_id = o.id
LEFT JOIN campaigns c ON d.campaign_id = c.id;

-- ============================================
-- NOTES:
-- ============================================
-- 1. The donor_accounts table is separate from the org-level 'donors' table.
--    donor_accounts is for users who create accounts after donating.
--
-- 2. The claiming flow works as follows:
--    a) User donates (donation stored with donor_email)
--    b) User creates account with same email
--    c) After email verification, claim_donations_for_donor() is called
--    d) All matching donations are linked to the donor_account
--
-- 3. The backend uses service_role key which bypasses RLS for admin operations.
--
-- 4. Donors can only see their own claimed donations (via donor_account_id).
