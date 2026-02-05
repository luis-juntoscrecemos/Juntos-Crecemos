import { z } from "zod";

// ============================================
// TypeScript Types matching Supabase Schema
// ============================================

// Organizations
export interface Organization {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  website: string | null;
  description: string | null;
  country: string;
  city: string;
  logo_url: string | null;
  slug: string;
  verified: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

export const insertOrganizationSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Correo electrónico inválido"),
  phone: z.string().nullable().optional(),
  website: z.string().url("URL inválida").nullable().optional(),
  description: z.string().nullable().optional(),
  country: z.string().min(2, "País requerido"),
  city: z.string().min(2, "Ciudad requerida"),
  logo_url: z.string().url().nullable().optional(),
  slug: z.string().min(2, "Slug requerido"),
});

export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;

// Organization Users (join table)
export interface OrganizationUser {
  id: string;
  organization_id: string;
  user_id: string;
  role: string;
  invited_by: string | null;
  created_at: string;
}

// Campaigns
export interface Campaign {
  id: string;
  org_id: string;
  title: string;
  slug: string;
  description: string | null;
  goal_amount: number | null;
  currency: string;
  is_active: boolean;
  suggested_amounts: number[] | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CampaignWithTotals extends Campaign {
  raised_minor: number;
  donations_count: number;
}

export const insertCampaignSchema = z.object({
  title: z.string().min(3, "El título debe tener al menos 3 caracteres"),
  slug: z.string().min(2, "Slug requerido").regex(/^[a-z0-9-]+$/, "Solo letras minúsculas, números y guiones"),
  description: z.string().nullable().optional(),
  goal_amount: z.number().positive("La meta debe ser mayor a 0").nullable().optional(),
  currency: z.string().default("COP"),
  is_active: z.boolean().default(true),
  suggested_amounts: z.array(z.number()).nullable().optional(),
  image_url: z.string().url().nullable().optional(),
});

export type InsertCampaign = z.infer<typeof insertCampaignSchema>;

// Donations
export interface Donation {
  id: string;
  campaign_id: string;
  org_id: string;
  donor_id: string | null;
  donor_account_id: string | null; // Link to donor_accounts for claimed donations
  amount_minor: number;
  currency: string;
  status: string;
  provider: string | null;
  external_id: string | null;
  is_recurring: boolean;
  paid_at: string | null;
  billing_country_code: string | null;
  billing_admin_area: string | null;
  billing_locality: string | null;
  billing_postal_code: string | null;
  billing_address_line1: string | null;
  billing_address_line2: string | null;
  amount_cop: number | null;
  cause_id: string | null;
  amount_cents: number | null;
  donor_name: string | null;
  donor_email: string | null;
  is_anonymous: boolean;
  stripe_payment_intent: string | null;
  created_at: string;
  updated_at: string;
}

export const insertDonationSchema = z.object({
  campaign_id: z.string().uuid(),
  donor_name: z.string().min(2, "Nombre requerido").nullable().optional(),
  donor_email: z.string().email("Correo electrónico inválido").nullable().optional(),
  amount_minor: z.number().positive("El monto debe ser mayor a 0"),
  currency: z.string().default("COP"),
  is_recurring: z.boolean().default(false),
  is_anonymous: z.boolean().default(false),
});

export type InsertDonation = z.infer<typeof insertDonationSchema>;

// Donors (legacy org-specific records)
export interface Donor {
  id: string;
  org_id: string;
  email: string | null;
  full_name: string | null;
  phone_e164: string | null;
  created_at: string;
  updated_at: string;
}

// Donor Accounts (for donor dashboard - linked to auth.users)
export interface DonorAccount {
  id: string;
  auth_user_id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  email_verified: boolean;
}

export const insertDonorAccountSchema = z.object({
  full_name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").nullable().optional(),
});

export type InsertDonorAccount = z.infer<typeof insertDonorAccountSchema>;

// Favorites (donor's favorite organizations)
export interface Favorite {
  donor_account_id: string;
  organization_id: string;
  created_at: string;
}

// Donor Dashboard Stats
export interface DonorDashboardStats {
  totalDonated: number;
  donationsCount: number;
  organizationsSupported: number;
  lastDonationDate: string | null;
}

// Donation with Organization info (for donor dashboard)
export interface DonationWithOrg extends Donation {
  organization_name?: string;
  organization_logo_url?: string | null;
  campaign_title?: string | null;
}

// Causes (legacy/additional entity)
export interface Cause {
  id: string;
  org_id: string;
  title: string;
  story: string | null;
  target_amount_cents: number | null;
  photo_url: string | null;
  public_slug: string | null;
  published: boolean;
  created_at: string;
}

// Auth User (from Supabase Auth)
export interface AuthUser {
  id: string;
  email: string;
  created_at: string;
}

// Dashboard Stats (legacy)
export interface DashboardStats {
  totalDonations: number;
  totalRaised: number;
  activeCampaigns: number;
  totalDonors: number;
}

// Dashboard Overview (date-range filtered)
export interface DashboardOverview {
  totalRaised: number;
  donationsCount: number;
  averageTicket: number;
  activeCampaigns: number;
}

// Dashboard Chart Data Point
export interface DashboardSeriesPoint {
  date: string;
  amount: number;
  count: number;
}

// Donation Detail (with campaign + org info)
export interface DonationDetail extends Donation {
  campaign_title: string | null;
  campaign_slug: string | null;
  organization_name: string | null;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// Legacy types for compatibility
export interface User {
  id: string;
  username: string;
  password: string;
}

export const insertUserSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
