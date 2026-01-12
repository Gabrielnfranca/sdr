# GitHub Copilot Instructions

## Project Overview
This is a **Lead Magnet Automator** application built with **Vite, React, TypeScript, and Supabase**. It uses **shadcn/ui** for components and **Tailwind CSS** for styling. The backend relies heavily on **Supabase Edge Functions**.

## Architecture & Data Flow

### Dual Type System (Critical)
The project maintains a strict separation between Backend (DB) types and Frontend (UI) types. You must respect this boundary.
- **DB Types (`src/lib/api.ts`)**: Use `snake_case`. Match Supabase database schema and Edge Function payloads.
  - Example: `company_name`, `site_classification`.
- **UI Types (`src/types/lead.ts`)**: Use `camelCase`. Used by React components.
  - Example: `companyName`, `classification`.
- **Adapters**: When fetching data, use adapter functions (like `mapSupabaseLeadToUILead` in `src/pages/Leads.tsx`) to transform DB types to UI types.

### Backend Integration
- **Edge Functions**: All complex logic (importing leads, analyzing sites, SDR decisions) resides in Supabase Edge Functions (`supabase/functions/`).
- **API Layer**: Do not call Edge Functions directly from components. Use the wrapper functions in `src/lib/api.ts`.
  - Pattern: `supabase.functions.invoke('function-name', { body: { ... } })`.

### State Management
- Use **TanStack Query** (`@tanstack/react-query`) for server state (fetching leads, etc.).
- See `src/hooks/useLeads.ts` for examples of wrapping Supabase calls in `useQuery`.

## Key Conventions

### UI Components
- **Library**: Use `shadcn/ui` components located in `src/components/ui`.
- **Icons**: Use `lucide-react`.
- **Styling**: Use Tailwind CSS utility classes. Avoid custom CSS files where possible.

### Routing & Auth
- **Router**: `react-router-dom`.
- **Auth**: Protected routes are wrapped in `ProtectedRoute` (see `src/App.tsx`).
- **Hook**: Use `useAuth()` from `@/hooks/useAuth` to access user state.

## Developer Workflows

### Adding a New Feature
1. **Backend**: Create/Update Supabase Edge Function in `supabase/functions/`.
2. **API Definition**: Update `src/lib/api.ts` with new types (snake_case) and wrapper functions.
3. **UI Types**: Update `src/types/lead.ts` if the UI model changes (camelCase).
4. **Data Fetching**: Create a hook in `src/hooks/` using TanStack Query.
5. **UI Implementation**: Build components using `shadcn/ui`.
6. **Integration**: Use an adapter to map API data to UI components.

### Common Commands
- `npm run dev`: Start development server (port 8080).
- `supabase functions deploy <function_name>`: Deploy a specific edge function.

## Critical Files
- `src/lib/api.ts`: Central hub for Backend types and API calls.
- `src/types/lead.ts`: Frontend domain models.
- `src/hooks/useLeads.ts`: Data fetching logic.
- `src/pages/Leads.tsx`: Example of the Adapter Pattern implementation.
- `supabase/functions/`: Backend logic source.
