import { getAccessToken } from './supabase';
import type { 
  Organization, 
  Campaign, 
  CampaignWithTotals,
  Donation, 
  DonationDetail,
  DonationIntentDetail,
  InsertOrganization,
  InsertCampaign,
  InsertDonation,
  InsertDonationIntent,
  DashboardStats,
  DashboardOverview,
  DashboardSeriesPoint,
  ApiResponse 
} from '@shared/schema';

const API_BASE = '/api';

async function apiRequest<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = await getAccessToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const body = await response.json();

    if (!response.ok) {
      return { error: body.error || 'Error en la solicitud' };
    }

    return body;
  } catch (error) {
    return { error: 'Error de conexión' };
  }
}

// Organizations
export const organizationsApi = {
  getMyOrganization: () => 
    apiRequest<Organization>('/organizations/me'),
  
  update: (id: string, data: Partial<InsertOrganization>) =>
    apiRequest<Organization>(`/organizations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  updateWithLogo: async (id: string, data: Partial<InsertOrganization>, logoFile?: File) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else if (value !== null) {
          formData.append(key, String(value));
        }
      }
    });
    if (logoFile) {
      formData.append('logo', logoFile);
    }
    const token = await getAccessToken();
    const res = await fetch(`/api/organizations/${id}`, {
      method: 'PATCH',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Error de conexión' }));
      throw new Error(err.error || 'Error al actualizar');
    }
    return res.json();
  },
  
  create: (data: InsertOrganization) =>
    apiRequest<Organization>('/organizations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Campaigns
export const campaignsApi = {
  list: () => 
    apiRequest<CampaignWithTotals[]>('/campaigns'),
  
  get: (id: string) =>
    apiRequest<CampaignWithTotals>(`/campaigns/${id}`),
  
  getBySlug: (slug: string) =>
    apiRequest<CampaignWithTotals>(`/campaigns/slug/${slug}`),
  
  create: (data: InsertCampaign) =>
    apiRequest<Campaign>('/campaigns', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id: string, data: Partial<InsertCampaign>) =>
    apiRequest<Campaign>(`/campaigns/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  
  delete: (id: string) =>
    apiRequest<void>(`/campaigns/${id}`, {
      method: 'DELETE',
    }),
};

// Donations
export interface DonationsFilterParams {
  campaign_id?: string;
  range?: string;
  start?: string;
  end?: string;
}

export const donationsApi = {
  list: (params?: DonationsFilterParams) => {
    const searchParams = new URLSearchParams();
    if (params?.campaign_id) searchParams.set('campaign_id', params.campaign_id);
    if (params?.range) searchParams.set('range', params.range);
    if (params?.start) searchParams.set('start', params.start);
    if (params?.end) searchParams.set('end', params.end);
    const query = searchParams.toString();
    return apiRequest<Donation[]>(`/donations${query ? `?${query}` : ''}`) as Promise<{ data?: Donation[]; totalCount?: number; totalAmount?: number; error?: string }>;
  },
  
  create: (data: InsertDonation) =>
    apiRequest<Donation>('/donations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  exportCsv: async () => {
    const token = await getAccessToken();
    const response = await fetch(`${API_BASE}/donations/export`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return response.blob();
  },

  exportPdf: async (params?: DonationsFilterParams) => {
    const searchParams = new URLSearchParams();
    if (params?.campaign_id) searchParams.set('campaign_id', params.campaign_id);
    if (params?.range) searchParams.set('range', params.range);
    if (params?.start) searchParams.set('start', params.start);
    if (params?.end) searchParams.set('end', params.end);
    const query = searchParams.toString();
    const token = await getAccessToken();
    const response = await fetch(`${API_BASE}/donations/export/pdf${query ? `?${query}` : ''}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) {
      throw new Error('Error al exportar PDF');
    }
    return response.blob();
  },
};

// Public API (no auth required)
export const publicApi = {
  getCampaign: (orgSlug: string, campaignSlug: string) =>
    apiRequest<{ campaign: CampaignWithTotals; organization: Organization; processing_fee_percent: number }>(
      `/public/campaigns/${orgSlug}/${campaignSlug}`
    ),
  
  createDonation: (data: InsertDonation & { org_id: string }) =>
    apiRequest<Donation>('/public/donations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  createDonationIntent: (data: InsertDonationIntent) =>
    apiRequest<{ intentId: string }>('/public/donation-intents', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getDonationIntent: (id: string) =>
    apiRequest<DonationIntentDetail>(`/public/donation-intents/${id}`),
};

// Dashboard
export const dashboardApi = {
  getStats: () =>
    apiRequest<DashboardStats>('/dashboard/stats'),
  getOverview: (start: string, end: string) =>
    apiRequest<DashboardOverview>(`/dashboard/overview?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`),
  getSeries: (start: string, end: string) =>
    apiRequest<DashboardSeriesPoint[]>(`/dashboard/series?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`),
  getRecentDonations: (start: string, end: string, limit: number = 15) =>
    apiRequest<DonationDetail[]>(`/dashboard/recent-donations?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&limit=${limit}`),
};

// Donation Detail
export const donationDetailApi = {
  get: (id: string) =>
    apiRequest<DonationDetail>(`/donations/${id}`),
};
