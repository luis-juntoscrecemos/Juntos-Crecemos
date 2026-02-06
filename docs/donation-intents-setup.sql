-- ============================================
-- Donation Intents Table
-- Processor-agnostic donation intent records
-- ============================================

CREATE TABLE IF NOT EXISTS donation_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  campaign_id UUID NOT NULL REFERENCES campaigns(id),
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'COP',
  cover_fees BOOLEAN NOT NULL DEFAULT false,
  fee_percent NUMERIC,
  fee_amount INTEGER NOT NULL DEFAULT 0,
  total_amount INTEGER NOT NULL,
  donation_type TEXT NOT NULL DEFAULT 'one_time',
  recurring_interval TEXT,
  donor_first_name TEXT NOT NULL,
  donor_last_name TEXT NOT NULL,
  donor_email TEXT NOT NULL,
  donor_note TEXT,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_donation_intents_campaign_id ON donation_intents(campaign_id);
CREATE INDEX IF NOT EXISTS idx_donation_intents_organization_id ON donation_intents(organization_id);
CREATE INDEX IF NOT EXISTS idx_donation_intents_created_at ON donation_intents(created_at);

-- RLS: Enable but allow server-side inserts via service_role
ALTER TABLE donation_intents ENABLE ROW LEVEL SECURITY;

-- Allow service_role full access (our Express API uses service_role key)
-- No public insert policy needed since we validate server-side
