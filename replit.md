# Juntos Crecemos - Donation Platform for NGOs

## Overview
Juntos Crecemos is a SaaS platform for South American NGOs to accept and manage donations. The platform provides NGO admins with tools to manage organization profiles, create campaigns, view donation analytics, and export donation data. Donors can use a fast, trustworthy, mobile-first donation form.

## Tech Stack
- **Frontend**: React (Vite) with TypeScript, Tailwind CSS, shadcn/ui components
- **Backend**: Express.js API with TypeScript
- **Database & Auth**: Supabase (external - PostgreSQL with Row Level Security)
- **Routing**: wouter for client-side routing
- **Forms**: react-hook-form with Zod validation
- **State**: TanStack React Query for server state

## Architecture

### Security Model
- Browser connects to Supabase ONLY for authentication (anon key)
- All application data (organizations, campaigns, donations) flows through Express API
- Express API uses Supabase service_role key (server-side only)
- JWT tokens from Supabase Auth are sent with API requests for authorization

### Key Directories
```
client/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── common/       # EmptyState, PageHeader, StatsCard, LoadingSpinner
│   │   ├── layout/       # AppShell (org), DonorShell (donor) with sidebars
│   │   └── ui/           # shadcn/ui base components
│   ├── contexts/         # AuthContext for Supabase auth state
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # API client, donorApi, Supabase client, utilities
│   └── pages/            # Route pages
│       ├── auth/         # Login, Register (for orgs)
│       ├── donor/        # DonorDashboard, DonorDonations, DonorFavorites, DonorSettings, DonorLogin
│       └── public/       # DonatePage (public donation form)
server/
├── middleware/           # Auth middleware (authMiddleware, donorAuthMiddleware)
├── routes.ts             # API routes (org + donor endpoints)
├── supabase.ts           # Supabase server client + helper functions
└── index.ts              # Express server setup
shared/
└── schema.ts             # TypeScript types (includes DonorAccount, Favorite, DonorDashboardStats)
docs/
├── supabase-setup.sql    # Initial Supabase setup (storage, orgs RLS)
├── donor-dashboard-setup.sql  # Donor tables, RLS policies, claim function
└── recurring-migration.sql    # Add recurring donation columns to campaigns
```

## Database Schema (Supabase)
Core tables:
- **organizations**: NGO profiles (name, email, slug, country, city, verified, status)
- **organization_users**: Links auth users to organizations (user_id, organization_id, role)
- **campaigns**: Fundraising campaigns (title, slug, description, goal_amount, is_active, suggested_amounts, image_url, allow_recurring, recurring_intervals, default_recurring_interval)
- **campaigns_with_totals**: View with raised_minor and donations_count
- **donations**: Individual donations (amount_minor, currency, status, donor_name, donor_email, is_recurring, is_anonymous, donor_account_id)
- **donor_accounts**: Donor user accounts linked to auth.users (auth_user_id, email, full_name, email_verified)
- **favorites**: Donor's favorite organizations (donor_account_id, organization_id)

## Environment Variables (Secrets)
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_ANON_KEY`: Public anon key (used by frontend for auth)
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key (backend only, never exposed)
- `RESEND_API_KEY`: Resend email service API key (for sending donation receipts)
- `RESEND_FROM_EMAIL`: (Optional) Custom from address for emails, e.g. `Juntos Crecemos <donaciones@juntoscrecemos.co>`. Requires verified domain on Resend. Falls back to `onboarding@resend.dev` which only sends to the Resend account owner's email.

Note: Frontend receives Supabase config via `/api/config` endpoint to avoid needing VITE_ prefixed env vars.

### Resend Email Setup
The Resend account is linked to `luis@juntoscrecemos.co`. To send donation receipt emails to ANY donor (not just the account owner), the domain `juntoscrecemos.co` must be verified at https://resend.com/domains. Once verified, set `RESEND_FROM_EMAIL` to something like `Juntos Crecemos <donaciones@juntoscrecemos.co>`.

## API Endpoints

### Protected (requires auth)
- `GET /api/dashboard/stats` - Dashboard statistics (legacy, all-time)
- `GET /api/dashboard/overview?start=&end=` - Date-range filtered KPIs (totalRaised, donationsCount, averageTicket, activeCampaigns)
- `GET /api/dashboard/series?start=&end=` - Chart data: daily aggregation of donations (date, amount, count)
- `GET /api/dashboard/recent-donations?start=&end=&limit=` - Recent donations with campaign info, date-range filtered
- `GET /api/organizations/me` - Get current user's organization
- `PATCH /api/organizations/:id` - Update organization
- `GET /api/campaigns` - List campaigns
- `POST /api/campaigns` - Create campaign (multipart form with optional image)
- `PATCH /api/campaigns/:id` - Update campaign (multipart form with optional image)
- `DELETE /api/campaigns/:id` - Delete campaign
- `GET /api/donations` - List donations
- `GET /api/donations/export` - Export donations as CSV
- `GET /api/donations/:id` - Get single donation detail with campaign/org info

### Public (no auth)
- `GET /api/public/organizations?q=` - Search active organizations by name (returns id, name, slug, logo_url, description, city, country, verified)
- `GET /api/public/campaigns/:orgSlug/:campaignSlug` - Get public campaign + organization
- `GET /api/public/organizations/:slug` - Get public organization profile with active campaigns
- `POST /api/public/donations` - Create donation (for public donation form)
- `POST /api/public/donation-intents` - Create donation intent + real donation record (status=paid)
- `GET /api/public/donation-intents/:id` - Get donation intent details with campaign/org info
- `POST /api/auth/register-org` - Register new organization (multipart form with logo upload)
- `GET /terminos` - Public Terms & Conditions page

### Donor Dashboard (requires donor auth)
- `GET /api/donor/check` - Check if user has donor account
- `POST /api/donor/register` - Create donor account and claim existing donations
- `GET /api/donor/stats` - Donor dashboard statistics
- `GET /api/donor/donations` - List donor's donations with org/campaign info
- `GET /api/donor/donations/by-month` - Donations grouped by month (for charts)
- `GET /api/donor/profile` - Get donor profile
- `PATCH /api/donor/profile` - Update donor profile (full_name)
- `GET /api/donor/favorites` - List favorite organizations
- `POST /api/donor/favorites` - Add favorite organization
- `DELETE /api/donor/favorites/:organizationId` - Remove favorite
- `GET /api/donor/favorites/check/:organizationId` - Check if org is favorited

## Running the App
The app runs via the "Start application" workflow which executes `npm run dev`. This starts both the Express backend and Vite frontend dev server.

## Design System
- **Primary Color**: Green #16A34A (142 76% 36%) - Brand color for CTAs and links
- **Primary Hover**: #15803D (142 72% 29%) - Darker green for hover states
- **Sidebar/Nav**: Navy #0B2D39 (194 69% 13%) - Dark navy for navigation
- **Accent Color**: Gold #F4B400 (45 100% 48%) - Small highlights only
- **Success**: Same as primary green
- **Warning**: #F59E0B (38 92% 50%)
- **Destructive/Error**: #DC2626 (0 84% 50%)
- **Typography**: Inter font family
- **Spacing**: 8px base system
- **Border Radius**: 8px (--radius: .5rem)

### Color Usage Guidelines
- Use `bg-primary`, `text-primary` for CTA buttons and links
- Use `bg-sidebar` for navigation backgrounds (navy)
- Use `bg-success`, `text-success` for success states
- Use `bg-warning`, `text-warning` for pending/warning states
- Use `bg-destructive`, `text-destructive` for errors
- Use `bg-accent` sparingly for small highlights/badges only

## Localization
- Primary language: Spanish (es-CO)
- Currency: Colombian Peso (COP) with locale-aware formatting
- Future support planned for Portuguese

## User Preferences
- Light mode first design
- Mobile-first responsive layouts
- Trust-focused UX for donation flows

## Donor Dashboard Feature
The platform supports two types of users:
1. **NGO Admins**: Manage organizations, campaigns, and view donations (routes: /dashboard, /organization, /campaigns, /donations)
2. **Donors**: View donation history and manage favorites (routes: /donor, /donor/donations, /donor/favorites, /donor/settings)

### Donor Flow
1. Donor makes a donation on public campaign page (/donar/:orgSlug/:campaignSlug)
2. After successful donation, sees CTA to create donor account
3. Donor logs in/registers at /donor/login
4. System creates donor_account and claims all donations matching email
5. Donor can view history, stats, and manage favorite organizations

### Account Disambiguation
- `/api/donor/check` returns `isDonor` and `isOrgUser` flags
- DonorProtectedRoute shows NoDonorProfile page if user has no donor account
- Users can be both org admins and donors simultaneously

### SQL Setup Required
Run `docs/donor-dashboard-setup.sql` in Supabase Dashboard to create:
- donor_accounts table
- favorites table
- Add donor_account_id column to donations
- RLS policies for donor access
- claim_donations_for_donor() function

Run `docs/short-id-migration.sql` in Supabase Dashboard to add:
- short_id column to donations and donation_intents tables

Run `docs/recurring-migration.sql` in Supabase Dashboard to add:
- allow_recurring, recurring_intervals, default_recurring_interval columns to campaigns table
- These columns are optional; the app gracefully degrades if they don't exist
