# Juntos Crecemos - Donation Platform for NGOs

## Overview
Juntos Crecemos is a SaaS platform designed to empower South American NGOs by providing them with a robust system to accept and manage donations. The platform streamlines the donation process for donors through a fast, trustworthy, and mobile-first experience. For NGO administrators, it offers comprehensive tools for managing organizational profiles, creating and overseeing fundraising campaigns, analyzing donation statistics, and exporting crucial donation data. The core vision is to become the leading donation platform for non-profits in South America, fostering growth and transparency for charitable organizations.

## User Preferences
- Light mode first design
- Mobile-first responsive layouts
- Trust-focused UX for donation flows

## System Architecture

### Core Technologies
The platform is built with a modern stack including React (Vite) with TypeScript, Tailwind CSS, and shadcn/ui for the frontend. The backend is an Express.js API also written in TypeScript. Supabase handles database operations (PostgreSQL with Row Level Security) and authentication. Client-side routing is managed by `wouter`, form handling by `react-hook-form` with `Zod` validation, and server state management by `TanStack React Query`.

### Security Model
The architecture prioritizes security by having the browser interact with Supabase solely for authentication using an anonymous key. All application data (organizations, campaigns, donations) is routed through the Express API, which leverages a Supabase `service_role` key (server-side only) for secure database access. JWT tokens obtained from Supabase Auth are used to authorize API requests.

### Key Features
- **NGO Admin Dashboard**: Tools for organization profile management, campaign creation, donation analytics, and data export.
- **Donor Portal**: Donors can view their donation history, manage favorite organizations, and track their contributions.
- **Public Donation Form**: A streamlined, mobile-first donation experience for the public.
- **Internal Admin Panel**: For platform staff to manage organizations, donors, and overall platform health.
- **Email Notifications**: Automated donation receipts and system emails via Resend.
- **Design System**: A consistent UI/UX with a defined color palette (Primary Green, Navy for navigation, Gold for accents), Inter font family, 8px spacing system, and 8px border radius.
- **Localization**: Primarily Spanish (es-CO) with Colombian Peso (COP) currency formatting, with future plans for Portuguese.

### Technical Implementations
- **Modular Directory Structure**: Separated `client/`, `server/`, and `shared/` directories for clear code organization.
- **Auth and Theming Contexts**: Global contexts for managing user authentication and theme preferences.
- **API Endpoints**: A comprehensive set of RESTful API endpoints categorized by access level (protected, public, donor, internal admin) for various functionalities.
- **Object Storage**: For branding assets like logos.
- **Dynamic Configuration**: Frontend receives Supabase configuration via an API endpoint to enhance security and flexibility.
- **Registration Flow**: New NGO registrations automatically create a default campaign, and their status requires internal admin review.

## External Dependencies
- **Supabase**: For PostgreSQL database, authentication, and object storage.
- **Resend**: Email service for sending transactional emails (e.g., donation receipts).