import { getAccessToken } from './supabase';
import type { 
  DonorAccount,
  DonorDashboardStats,
  DonationWithOrg,
  Favorite,
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

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error || 'Error en la solicitud' };
    }

    return { data };
  } catch (error) {
    return { error: 'Error de conexión' };
  }
}

// Donor Account
export const donorApi = {
  checkAccount: () => 
    apiRequest<{ isDonor: boolean; isOrgUser: boolean; donorAccountId: string | null }>('/donor/check'),
  
  register: (fullName?: string) =>
    apiRequest<DonorAccount>('/donor/register', {
      method: 'POST',
      body: JSON.stringify({ full_name: fullName }),
    }),
  
  getProfile: () => 
    apiRequest<DonorAccount>('/donor/profile'),
  
  updateProfile: (fullName: string) =>
    apiRequest<DonorAccount>('/donor/profile', {
      method: 'PATCH',
      body: JSON.stringify({ full_name: fullName }),
    }),
  
  getStats: () => 
    apiRequest<DonorDashboardStats>('/donor/stats'),
  
  getDonations: () => 
    apiRequest<DonationWithOrg[]>('/donor/donations'),
  
  getDonationsByMonth: () => 
    apiRequest<{ month: string; amount: number }[]>('/donor/donations/by-month'),
  
  getFavorites: () => 
    apiRequest<(Favorite & { organizations: { id: string; name: string; logo_url: string | null; slug: string; description: string | null } })[]>('/donor/favorites'),
  
  addFavorite: (organizationId: string) =>
    apiRequest<Favorite>('/donor/favorites', {
      method: 'POST',
      body: JSON.stringify({ organization_id: organizationId }),
    }),
  
  removeFavorite: (organizationId: string) =>
    fetch(`${API_BASE}/donor/favorites/${organizationId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('supabase_token') || ''}`,
      },
    }),
  
  checkFavorite: (organizationId: string) =>
    apiRequest<{ isFavorited: boolean }>(`/donor/favorites/check/${organizationId}`),
};
