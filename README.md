# Project Overview
- Project name: Cerebro
- One-line goal: A product feedback dashboard with an Overview (triage) page and a PM Metrics page for longitudinal product health signals, backed by mock data and Cloudflare Workers/Pages APIs.
- Explicit non-goals / out-of-scope items:
  - No real third-party integrations (all data is mock in this codebase).
  - No authentication or user accounts.
  - No backend persistence for feedback items beyond mock data (D1 is only used for metrics seed/demo).

# Tech Stack
- Language(s): TypeScript, SQL (D1 migration/seed)
- Framework(s): React 18, Vite 5
- Libraries / SDKs:
  - UI: Tailwind CSS, shadcn/ui (Radix UI primitives), lucide-react
  - Charts: Recharts
  - Data/query: @tanstack/react-query
  - Dates: date-fns
  - Forms/validation: react-hook-form, zod
  - Testing: Vitest, @testing-library/react
- Database / storage: Cloudflare D1 (metrics table only), mock data in `src/data/mockFeedback.ts`
- Infrastructure / hosting: Cloudflare Workers + Pages Functions (see `src/worker.ts` and `functions/api/*`), Vite dev server
- Auth (if any): None
- AI / ML components (if any): Cloudflare Workers AI via `env.AI` in `src/worker.ts` and `functions/api/insights.ts`

# Architecture
- High-level components:
  - Frontend SPA (React/Vite) with routes: Overview (`/`), PM Metrics (`/pm-metrics`), Themes (`/themes`), NotFound
  - Shared topbar (`Header`) with refresh, bell overlay (Needs Attention), nav links
  - Mock data generator and schema (`src/data/mockFeedback.ts`)
  - Filtering logic for View Tickets (`src/utils/feedbackTableFilters.ts`)
  - Needs Attention overlay logic (`src/components/dashboard/NeedsAttentionOverlay.tsx`)
  - Cloudflare Pages Functions endpoints (`functions/api/*`)
  - Cloudflare Worker (`src/worker.ts`) that serves APIs and assets
- Responsibility of each component:
  - `Header`: topbar UI, refresh button, alert bell overlay positioning
  - `NeedsAttentionOverlay`: renders Active Alerts + Emerging Issues + AI Insights overlay content
  - `FeedbackTable`: View Tickets table, local filters, sorting, CSV export, ticket detail modal
  - `TrendsCard`: Trends chart (absolute counts) with selection/toggle
  - `KpiStrip`: KPI cards row on Overview
  - `PmMetrics`: PM Metrics dashboard with KPI row + charts/lists
  - `mockFeedback`: generates ~6000 tickets with enriched schema
  - `feedbackTableFilters`: filter state, URL parsing/serialization, client-side predicate
  - `functions/api/*` and `src/worker.ts`: API endpoints returning mock feedback/metrics/insights, optional Workers AI
- End-to-end data flow (step-by-step):
  1. UI loads a page (`Index`, `PmMetrics`, etc.).
  2. Pages call `/api/feedback` (via fetch) to retrieve serialized `FeedbackItem` objects.
  3. Client deserializes `timestamp` into `Date` and uses `createdAt`/`updatedAt` for filtering/sorting.
  4. Overview uses filters to compute KPIs and trends; View Tickets uses `applyFilters`.
  5. Needs Attention overlay uses `buildNeedsAttentionData` on in-memory feedback.
  6. Optional APIs: `/api/metrics` and `/api/insights` compute metrics/insights (Workers AI if configured).
  7. Worker (`src/worker.ts`) routes API requests and serves static assets.
- External integrations (APIs, services, webhooks):
  - Cloudflare Workers AI (`env.AI`), Cloudflare D1 (`env.ANALYTICS_DB`)
  - No other external APIs; external links on tickets are mock URLs.

# Repository Structure
- `index.html`
  - Purpose: Vite HTML entry and document metadata.
  - Key functions / classes / exports: N/A
  - Critical assumptions or invariants: Favicon links to `/favicon.svg` and `/favicon.ico`.
- `package.json`
  - Purpose: Dependency and script definitions.
  - Key functions / classes / exports: N/A
  - Critical assumptions or invariants: Uses Vite, React, Tailwind, Radix.
- `package-lock.json`
  - Purpose: npm lockfile.
  - Key functions / classes / exports: N/A
  - Critical assumptions or invariants: Must stay in sync with `package.json`.
- `bun.lockb`
  - Purpose: Bun lockfile.
  - Key functions / classes / exports: N/A
  - Critical assumptions or invariants: UNKNOWN (not inspected).
- `vite.config.ts`
  - Purpose: Vite build config.
  - Key functions / classes / exports: Vite config.
  - Critical assumptions or invariants: UNKNOWN (not inspected).
- `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`
  - Purpose: TypeScript configuration.
  - Key functions / classes / exports: N/A
  - Critical assumptions or invariants: UNKNOWN (not inspected).
- `eslint.config.js`
  - Purpose: ESLint configuration.
  - Key functions / classes / exports: ESLint config.
  - Critical assumptions or invariants: UNKNOWN (not inspected).
- `postcss.config.js`, `tailwind.config.ts`
  - Purpose: CSS tooling configuration.
  - Key functions / classes / exports: N/A
  - Critical assumptions or invariants: Tailwind is used throughout UI.
- `components.json`
  - Purpose: shadcn/ui configuration.
  - Key functions / classes / exports: N/A
  - Critical assumptions or invariants: UNKNOWN (not inspected).
- `README.md`
  - Purpose: Project documentation (THIS file).
  - Key functions / classes / exports: N/A
  - Critical assumptions or invariants: Must be source of truth.
- `public/placeholder.svg`
  - Purpose: Placeholder asset.
  - Key functions / classes / exports: N/A
  - Critical assumptions or invariants: UNKNOWN (not inspected).
- `public/favicon.ico`
  - Purpose: Fallback favicon.
  - Key functions / classes / exports: N/A
  - Critical assumptions or invariants: Browser should prefer SVG if supported.
- `public/favicon.svg`
  - Purpose: Primary favicon (brain icon).
  - Key functions / classes / exports: N/A
  - Critical assumptions or invariants: Should match topbar brain icon.
- `public/robots.txt`
  - Purpose: Robots directive.
  - Key functions / classes / exports: N/A
  - Critical assumptions or invariants: UNKNOWN (not inspected).
- `scripts/seed-d1.sql`
  - Purpose: Seed `feedback_metrics` table in D1.
  - Key functions / classes / exports: N/A
  - Critical assumptions or invariants: Table `feedback_metrics` exists.
- `migrations/0001_init.sql`
  - Purpose: D1 migration creating `feedback_metrics`.
  - Key functions / classes / exports: N/A
  - Critical assumptions or invariants: D1 database named in `wrangler.toml`.
- `wrangler.toml`
  - Purpose: Cloudflare Workers/Pages config.
  - Key functions / classes / exports: N/A
  - Critical assumptions or invariants: UNKNOWN (not inspected).

## src/
- `src/main.tsx`
  - Purpose: React app entry (renders `App`).
  - Key functions / classes / exports: N/A
  - Critical assumptions or invariants: UNKNOWN (not inspected).
- `src/App.tsx`
  - Purpose: Router configuration.
  - Key functions / classes / exports: default App component.
  - Critical assumptions or invariants: Routes are `/`, `/themes`, `/pm-metrics`, `*`.
- `src/App.css`
  - Purpose: App-level styling.
  - Key functions / classes / exports: N/A
  - Critical assumptions or invariants: UNKNOWN (not inspected).
- `src/index.css`
  - Purpose: Global CSS (Tailwind base).
  - Key functions / classes / exports: N/A
  - Critical assumptions or invariants: UNKNOWN (not inspected).
- `src/vite-env.d.ts`
  - Purpose: Vite TypeScript env types.
  - Key functions / classes / exports: N/A
  - Critical assumptions or invariants: UNKNOWN (not inspected).
- `src/worker.ts`
  - Purpose: Cloudflare Worker for API + asset serving.
  - Key functions / classes / exports: default fetch handler.
  - Critical assumptions or invariants:
    - `env.ANALYTICS_DB` is a D1 database.
    - `env.AI` (Workers AI) is optional; fallback uses mock insights.
- `src/data/mockFeedback.ts`
  - Purpose: Mock dataset generator and schema.
  - Key functions / classes / exports: `mockFeedback`, `issueTypeConfig`, `sourceConfig`, types.
  - Critical assumptions or invariants:
    - Ticket schema includes `createdAt`, `updatedAt`, `priorityScore`, `customerSegment`, `tags`, `jiraUrl`, `mediaUrl`.
- `src/lib/apiClient.ts`
  - Purpose: API client types (Entries/Themes/Trends).
  - Key functions / classes / exports: Types and/or fetch helpers.
  - Critical assumptions or invariants: UNKNOWN (not inspected).
- `src/lib/kpiUtils.ts`
  - Purpose: KPI filters + helper computations (negative %, critical %, top source).
  - Key functions / classes / exports: `applyEntryFilters`, `computeCriticalPercentage`, `computeTopSource`, etc.
  - Critical assumptions or invariants:
    - Uses `createdAt` or `timestamp` for time filtering.
- `src/lib/utils.ts`
  - Purpose: Utility helpers (className merging).
  - Key functions / classes / exports: `cn` etc.
  - Critical assumptions or invariants: UNKNOWN (not inspected).
- `src/utils/feedbackTableFilters.ts`
  - Purpose: View Tickets filter state, URL parsing/serialization, filter predicate.
  - Key functions / classes / exports: `TableFilters`, `DEFAULT_FILTERS`, `applyFilters`, `parseFiltersFromSearch`, `serializeFiltersToSearch`.
  - Critical assumptions or invariants:
    - Time filtering uses `createdAt` when present; fallback to `timestamp`.
    - Priority bands derived from `priorityScore`.
- `src/utils/emergingThemes.ts`
  - Purpose: Emerging theme detection logic.
  - Key functions / classes / exports: `computeEmergingThemes` + helpers.
  - Critical assumptions or invariants: UNKNOWN (not inspected).
- `src/hooks/useDashboardKpis.ts`
  - Purpose: Fetch + compute KPI values.
  - Key functions / classes / exports: hook.
  - Critical assumptions or invariants: UNKNOWN (not inspected).
- `src/hooks/use-mobile.tsx`, `src/hooks/use-toast.ts`
  - Purpose: Responsive and toast hooks.
  - Key functions / classes / exports: hooks.
  - Critical assumptions or invariants: UNKNOWN (not inspected).

## src/pages/
- `src/pages/Index.tsx`
  - Purpose: Overview page (triage).
  - Key functions / classes / exports: default `Index`.
  - Critical assumptions or invariants:
    - Uses `NeedsAttentionOverlay` for bell overlay content.
    - Loads feedback via `/api/feedback` fallback to `mockFeedback`.
- `src/pages/PmMetrics.tsx`
  - Purpose: PM Metrics page (product health signals).
  - Key functions / classes / exports: default `PmMetrics`.
  - Critical assumptions or invariants:
    - Uses absolute counts; compare vs previous period when enabled.
    - Uses `NeedsAttentionOverlay` for bell overlay.
- `src/pages/Themes.tsx`
  - Purpose: Themes detail placeholder.
  - Key functions / classes / exports: default `Themes`.
  - Critical assumptions or invariants: Uses `Header` and Needs Attention overlay based on mock data.
- `src/pages/NotFound.tsx`
  - Purpose: 404 page.
  - Key functions / classes / exports: default `NotFound`.
  - Critical assumptions or invariants: Uses `Header` and Needs Attention overlay based on mock data.

## src/components/dashboard/
- `Header.tsx`
  - Purpose: Top bar with brand, nav, refresh, bell overlay anchor.
  - Key functions / classes / exports: `Header`.
  - Critical assumptions or invariants:
    - Bell overlay content is passed via `needsAttentionContent`.
- `NeedsAttentionOverlay.tsx`
  - Purpose: Shared overlay content for bell icon.
  - Key functions / classes / exports: `NeedsAttentionOverlay`, `buildNeedsAttentionData`.
  - Critical assumptions or invariants:
    - Uses last 7 days window, high/critical unresolved alerts.
- `KpiCard.tsx`
  - Purpose: Generic KPI card layout with optional tooltip and right-aligned title content.
  - Key functions / classes / exports: `KpiCard`.
  - Critical assumptions or invariants: Title row supports optional info icon and custom `titleRight`.
- `KpiStrip.tsx`
  - Purpose: Overview KPI row and theme distribution card.
  - Key functions / classes / exports: `KpiStrip`.
  - Critical assumptions or invariants:
    - `isFiltering` triggers spinner in titles.
- `TrendsCard.tsx`
  - Purpose: Trends line chart with time slicing and legend toggles.
  - Key functions / classes / exports: `TrendsCard`.
  - Critical assumptions or invariants:
    - Series: Total Tickets, Priority Tickets (High+Critical), Negative Tickets.
- `FeedbackTable.tsx`
  - Purpose: View Tickets table with filters, sorting, chips, CSV export, detail modal.
  - Key functions / classes / exports: `FeedbackTable`.
  - Critical assumptions or invariants:
    - Relies on `applyFilters` from `feedbackTableFilters.ts`.
- `FeedbackDetail.tsx`
  - Purpose: Ticket detail modal.
  - Key functions / classes / exports: `FeedbackDetail`.
  - Critical assumptions or invariants: Shows ticket details; status is read-only (no resolve action).
- `FilterBar.tsx`
  - Purpose: Global filter bar (Source + Time).
  - Key functions / classes / exports: `FilterBar`.
  - Critical assumptions or invariants: Uses `activeTime` and `customRange` from parent.
- `AIInsights.tsx`
  - Purpose: AI insights card UI.
  - Key functions / classes / exports: `AIInsights`.
  - Critical assumptions or invariants: Can render filtered insights list.
- `EmergingThemesCard.tsx`, `SentimentChart.tsx`, `CategoryChart.tsx`, `SourceDistribution.tsx`, `IssueTrendModal.tsx`, `MetricCard.tsx`
  - Purpose: UNKNOWN (not inspected).
  - Key functions / classes / exports: UNKNOWN (not inspected).
  - Critical assumptions or invariants: UNKNOWN (not inspected).

## src/components/ui/
- All files under `src/components/ui/*`
  - Purpose: shadcn/ui components (Radix wrappers).
  - Key functions / classes / exports: Component(s) per file.
  - Critical assumptions or invariants: UNKNOWN (not inspected).

## functions/api/
- `functions/api/feedback.ts`
  - Purpose: Pages Function for `/api/feedback` (returns mock feedback).
  - Key functions / classes / exports: `onRequest`.
  - Critical assumptions or invariants: Uses `mockFeedback`.
- `functions/api/metrics.ts`
  - Purpose: Pages Function for `/api/metrics` (computes metrics; writes to D1).
  - Key functions / classes / exports: `onRequest`.
  - Critical assumptions or invariants: `env.ANALYTICS_DB` is configured.
- `functions/api/insights.ts`
  - Purpose: Pages Function for `/api/insights` (Workers AI or fallback).
  - Key functions / classes / exports: `onRequest`.
  - Critical assumptions or invariants: `env.AI` optional; returns default insights if absent.

## tests/
- `src/test/feedbackTableFilters.test.ts`
  - Purpose: Tests for filter parsing/predicate.
  - Key functions / classes / exports: N/A
  - Critical assumptions or invariants: Uses `applyFilters` and `parseFiltersFromSearch`.
- `src/test/example.test.ts`, `src/test/setup.ts`
  - Purpose: UNKNOWN (not inspected).
  - Key functions / classes / exports: UNKNOWN (not inspected).
  - Critical assumptions or invariants: UNKNOWN (not inspected).

# Implementation Details
- Core business logic:
  - `applyFilters` (View Tickets) applies AND across filter categories and OR within a category; time filtering uses `createdAt`/`timestamp`.
  - Priority bands: P0 >= 80, P1 60–79, P2 40–59, P3 < 40.
  - Needs Attention overlay:
    - Active Alerts = unresolved high/critical tickets within last 7 days (sorted critical before high, then oldest first).
    - Emerging Issues computed via `computeEmergingThemes`.
  - PM Metrics:
    - Time range supports 7/30/90 days or custom; compare against previous window.
    - KPI deltas are absolute differences; median uses `median` helper.
    - “Priority Tickets” in Trends = High + Critical urgency count.
- State management approach:
  - Local component state via `useState`, derived values via `useMemo`.
  - URL query params handled in `feedbackTableFilters.ts`.
- Error handling behavior:
  - API fetches fall back to `mockFeedback` on error.
  - Workers AI failures fall back to default insights.
- Edge cases handled:
  - Missing timestamps fallback to `createdAt` or `timestamp`.
  - Empty datasets show placeholders (`—`) or empty states.
- Performance considerations already implemented:
  - Heavy computations memoized via `useMemo`.
  - Filters use precomputed search text in `Index`.

# Key Decisions & Constraints
- SPA only, no SSR.
- Mock data is the primary dataset; backend endpoints serve the same mock data.
- UI design must follow existing dark, glassy cards and shadcn components.
- Overview focuses on triage; PM Metrics focuses on longitudinal trends.
- Filters and sorting should be stable and predictable.

# Current Project State
- Fully working features:
  - Overview dashboard with KPI cards, Trends chart, Needs Attention overlay.
  - PM Metrics dashboard with multiple sections and charts.
  - View Tickets table with filters, sorting, CSV export, detail modal.
  - Cloudflare Worker/Pages endpoints `/api/feedback`, `/api/metrics`, `/api/insights`.
- Partially implemented features:
  - Reopen rate metric on PM Metrics shows “Coming soon”.
- Broken or unimplemented features:
  - UNKNOWN (not verified in this session).

# Open Tasks (Priority Order)
- Validate PM Metrics deep-link filters and update any mismatches in query params:
  - Intended behavior: clicking “View” in PM Metrics lists applies filters via query params.
  - Relevant files: `src/pages/PmMetrics.tsx`, `src/utils/feedbackTableFilters.ts`.
  - Known pitfalls or context: Query param parsing lowercases and normalizes values.
- Confirm performance/lag improvements:
  - Intended behavior: interactions remain responsive with ~6000 mock entries.
  - Relevant files: `src/pages/Index.tsx`, `src/components/dashboard/TrendsCard.tsx`.
  - Known pitfalls or context: chart interactions can be expensive if not memoized.
- Validate overlay behavior:
  - Intended behavior: bell overlay closes only on outside click; consistent across pages.
  - Relevant files: `src/components/dashboard/Header.tsx`, `src/components/dashboard/NeedsAttentionOverlay.tsx`.
  - Known pitfalls or context: overlay should ignore clicks on bell and inside overlay.

# Known Issues & Risks
- User-reported performance lag previously; current status UNKNOWN.
- Many components are uninspected; behavior assumptions may be incomplete.
- The PM Metrics page uses mock data only; real backend integrations are not present.

# Rules for Future Development
- Coding standards to follow:
  - Keep TypeScript strictness; prefer typed props and helpers.
  - Reuse existing design components and Tailwind utility patterns.
- Things future Codex sessions must NEVER do:
  - Do not remove mock data fields without updating all dependent UI/filter logic.
  - Do not introduce new design patterns that conflict with existing dark/glass UI.
- Things future Codex sessions must ALWAYS do:
  - Update URL query serialization when adding new table filters.
  - Keep Overview and PM Metrics topbar behavior consistent.

# Continuation Instructions
- Exact next task to work on: Validate PM Metrics deep-link filters and update any mismatches in query params.
- Preconditions before starting: App builds and loads without runtime errors.
- Expected outcome of the next task: Clicking “View” in PM Metrics lists navigates to Overview with filters applied and table reflecting those filters.
