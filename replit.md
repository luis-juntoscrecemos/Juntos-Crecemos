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
│   │   ├── layout/       # AppShell with sidebar
│   │   └── ui/           # shadcn/ui base components
│   ├── contexts/         # AuthContext for Supabase auth state
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # API client, Supabase client, utilities
│   └── pages/            # Route pages
│       ├── auth/         # Login, Register
│       └── public/       # DonatePage (public donation form)
server/
├── middleware/           # Auth middleware for JWT validation
├── routes.ts             # API routes
├── supabase.ts           # Supabase server client
└── index.ts              # Express server setup
shared/
└── schema.ts             # TypeScript types matching Supabase schema
```

## Database Schema (Supabase)
Core tables:
- **organizations**: NGO profiles (name, email, slug, country, city, verified, status)
- **organization_users**: Links auth users to organizations (user_id, organization_id, role)
- **campaigns**: Fundraising campaigns (title, slug, description, goal_amount, is_active)
- **campaigns_with_totals**: View with raised_minor and donations_count
- **donations**: Individual donations (amount_minor, currency, status, donor_name, donor_email, is_recurring, is_anonymous)

## Environment Variables (Secrets)
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_ANON_KEY`: Public anon key (used by frontend for auth)
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key (backend only, never exposed)

Note: Frontend receives Supabase config via `/api/config` endpoint to avoid needing VITE_ prefixed env vars.

## API Endpoints

### Protected (requires auth)
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/organizations/me` - Get current user's organization
- `PATCH /api/organizations/:id` - Update organization
- `GET /api/campaigns` - List campaigns
- `POST /api/campaigns` - Create campaign
- `PATCH /api/campaigns/:id` - Update campaign
- `DELETE /api/campaigns/:id` - Delete campaign
- `GET /api/donations` - List donations
- `GET /api/donations/export` - Export donations as CSV

### Public (no auth)
- `GET /api/public/campaigns/:orgSlug/:campaignSlug` - Get public campaign + organization
- `POST /api/public/donations` - Create donation (for public donation form)

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
