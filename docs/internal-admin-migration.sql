-- Migration: Internal Admin Dashboard
-- Run this in the Supabase SQL Editor.
-- Creates tables for internal admin management, invites, and audit logging.

-- 1. Internal Admins table
CREATE TABLE IF NOT EXISTS internal_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id),
  email text UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'ADMIN' CHECK (role IN ('SUPER_ADMIN', 'ADMIN', 'VIEWER')),
  status text NOT NULL DEFAULT 'INVITED' CHECK (status IN ('ACTIVE', 'INVITED', 'DISABLED')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Internal Admin Invites table
CREATE TABLE IF NOT EXISTS internal_admin_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  role text NOT NULL DEFAULT 'ADMIN' CHECK (role IN ('SUPER_ADMIN', 'ADMIN', 'VIEWER')),
  token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  created_by uuid REFERENCES internal_admins(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Internal Audit Logs table
CREATE TABLE IF NOT EXISTS internal_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid,
  actor_email text,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Add status column to organizations (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'status'
  ) THEN
    ALTER TABLE organizations ADD COLUMN status text NOT NULL DEFAULT 'ACTIVE';
  END IF;
END $$;

-- 5. RLS policies: deny all public/anon access to internal tables
ALTER TABLE internal_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE internal_admin_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE internal_audit_logs ENABLE ROW LEVEL SECURITY;

-- No RLS policies = service_role can access, but anon/authenticated cannot
-- Drop any existing permissive policies just in case
DROP POLICY IF EXISTS "internal_admins_deny_all" ON internal_admins;
DROP POLICY IF EXISTS "internal_admin_invites_deny_all" ON internal_admin_invites;
DROP POLICY IF EXISTS "internal_audit_logs_deny_all" ON internal_audit_logs;

-- 6. Create index on audit logs for efficient querying
CREATE INDEX IF NOT EXISTS idx_internal_audit_logs_created_at ON internal_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_internal_audit_logs_action ON internal_audit_logs(action);

-- 7. Seed the first internal admin (luis@juntoscrecemos.co)
INSERT INTO internal_admins (email, role, status)
VALUES ('luis@juntoscrecemos.co', 'SUPER_ADMIN', 'ACTIVE')
ON CONFLICT (email) DO UPDATE SET role = 'SUPER_ADMIN', status = 'ACTIVE';
