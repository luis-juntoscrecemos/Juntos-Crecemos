import { getAccessToken } from './supabase';

async function internalFetch<T>(endpoint: string, options: RequestInit = {}): Promise<{ data?: T; error?: string }> {
  try {
    const token = await getAccessToken();
    const headers: Record<string, string> = {
      ...((options.headers as Record<string, string>) || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!options.body || typeof options.body === 'string') {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`/api/internal${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { error: errorData.error || errorData.message || `Error ${response.status}` };
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/csv') || contentType.includes('application/pdf')) {
      const blob = await response.blob();
      return { data: blob as any };
    }

    const json = await response.json();
    return { data: json };
  } catch (err: any) {
    return { error: err.message || 'Error de red' };
  }
}

export const internalApi = {
  check: () => internalFetch('/check'),
  
  getMetrics: (range: string = 'all') => internalFetch(`/metrics?range=${range}`),
  getMetricsSeries: (range: string = '30') => internalFetch(`/metrics/series?range=${range}`),
  getTopOrgs: (range: string = 'all', limit: number = 10) => internalFetch(`/metrics/top-orgs?range=${range}&limit=${limit}`),

  getOrgs: (params: Record<string, any> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return internalFetch(`/orgs?${qs}`);
  },
  getOrg: (id: string) => internalFetch(`/orgs/${id}`),
  updateOrgStatus: (id: string, status: string, reason: string) =>
    internalFetch(`/orgs/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status, reason }),
    }),

  getPendingOrgs: (params: Record<string, any> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return internalFetch(`/pending-orgs?${qs}`);
  },
  reviewOrg: (id: string, action: 'APPROVED' | 'REJECTED', review_notes?: string) =>
    internalFetch(`/orgs/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ action, review_notes }),
    }),

  getDonors: (params: Record<string, any> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return internalFetch(`/donors?${qs}`);
  },
  getDonor: (id: string) => internalFetch(`/donors/${id}`),

  getDonations: (params: Record<string, any> = {}) => {
    const filtered = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== undefined && v !== null));
    const qs = new URLSearchParams(filtered).toString();
    return internalFetch(`/donations?${qs}`);
  },

  getAdmins: () => internalFetch('/admins'),
  createInvite: (email: string, role: string) =>
    internalFetch('/invites', {
      method: 'POST',
      body: JSON.stringify({ email, role }),
    }),
  verifyInvite: async (token: string): Promise<{ data?: { email: string; role: string }; error?: string }> => {
    try {
      const response = await fetch(`/api/internal/invites/verify?token=${encodeURIComponent(token)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { error: errorData.error || `Error ${response.status}` };
      }
      const json = await response.json();
      return { data: json };
    } catch (err: any) {
      return { error: err.message || 'Error de red' };
    }
  },
  acceptInvite: (token: string) =>
    internalFetch('/invites/accept', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),

  startImpersonation: (orgId: string) =>
    internalFetch('/impersonation/start', {
      method: 'POST',
      body: JSON.stringify({ orgId }),
    }),
  stopImpersonation: (orgId?: string) =>
    internalFetch('/impersonation/stop', {
      method: 'POST',
      body: JSON.stringify({ orgId }),
    }),

  exportOrgs: (params: Record<string, any> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return internalFetch(`/exports/orgs?${qs}`);
  },
  exportDonations: (params: Record<string, any> = {}) => {
    const filtered = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== undefined && v !== null));
    const qs = new URLSearchParams(filtered).toString();
    return internalFetch(`/exports/donations?${qs}`);
  },

  getAuditLogs: (params: Record<string, any> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return internalFetch(`/audit-logs?${qs}`);
  },

  getHealth: () => internalFetch('/health'),
};
