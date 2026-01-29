import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Warning: Supabase credentials not configured');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Verify JWT token from Supabase Auth
export async function verifyToken(token: string): Promise<{ userId: string; email: string } | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return null;
    }
    
    return {
      userId: user.id,
      email: user.email || '',
    };
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

// Get user's organization
export async function getUserOrganization(userId: string) {
  const { data, error } = await supabase
    .from('organization_users')
    .select('organization_id, role, organizations(*)')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    organizationId: data.organization_id,
    role: data.role,
    organization: data.organizations,
  };
}
