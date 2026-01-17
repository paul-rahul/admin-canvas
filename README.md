# Project Overview
- Project name: admin-canvas (package name: vite_react_shadcn_ts; app title: Feedback Hub)
- One-line goal: A Cloudflare-themed product feedback dashboard that aggregates mock feedback data, computes KPIs, shows AI insights, and lists tickets with filtering.
- Explicit non-goals / out-of-scope items:
  - No real backend data integrations (all feedback is mock data in the repo).
  - No authentication or user management.
  - No server-side filtering/aggregation beyond the existing mock Pages Functions.
  - No custom domain setup required.
  - No storage products beyond Cloudflare D1 (no R2, KV, etc.).

# Tech Stack
- Language(s): TypeScript, JavaScript (config), SQL (D1 migration), CSS
- Framework(s): React 18, Vite 5
- Libraries / SDKs:
  - UI: Tailwind CSS, shadcn/ui, Radix UI, lucide-react
  - Charts: Recharts
  - Routing: react-router-dom
  - Data fetching: native fetch, @tanstack/react-query (configured but not used heavily)
  - Dates: date-fns
  - Testing: Vitest, Testing Library
- Database / storage: Cloudflare D1 (table: feedback_metrics)
- Infrastructure / hosting: Cloudflare Pages + Pages Functions; optional Cloudflare Workers (src/worker.ts)
- Auth (if any): None
- AI / ML components (if any): Cloudflare Workers AI via `env.AI` using model `@cf/meta/llama-3-8b-instruct`

# Architecture
- High-level components:
  - React SPA (Vite) in `src/` renders the dashboard UI and handles client-side filtering.
  - Cloudflare Pages Functions in `functions/api/*` serve mock API endpoints for feedback, metrics, and AI insights.
  - D1 database stores the `feedback_metrics` record when `/api/metrics` is called.
  - Mock data generator in `src/data/mockFeedback.ts` produces the feedback dataset used by the UI and functions.
- Responsibility of each component:
  - `src/pages/Index.tsx`: main dashboard page; owns filters, loads feedback, computes local KPIs, and renders cards and tables.
  - `functions/api/feedback.ts`: returns serialized mock feedback data.
  - `functions/api/metrics.ts`: computes metrics from mock data and upserts them into D1.
  - `functions/api/insights.ts`: returns AI insights from Workers AI (or fallback insights if AI fails).
  - `src/utils/emergingThemes.ts`: client-side emerging theme detection algorithm.
- End-to-end data flow (step-by-step):
  1) Browser loads the SPA from Vite/Pages.
  2) `Index.tsx` fetches `/api/feedback` and converts timestamps to `Date` objects; on failure it falls back to local `mockFeedback`.
  3) Client-side filtering is applied based on search, source, and time filter state.
  4) `KpiStrip` uses `useDashboardKpis` with an entries override (filtered data) to compute KPIs client-side.
  5) `EmergingThemesCard` uses `computeEmergingThemes` with the filtered data and time window.
  6) `AIInsights` fetches `/api/insights` and falls back to local insights if the API fails.
  7) `FeedbackTable` renders paginated feedback rows and opens `FeedbackDetail` on selection.
  8) `functions/api/metrics.ts` only runs if `/api/metrics` is called (not invoked by the UI today).
- External integrations (APIs, services, webhooks):
  - Cloudflare Pages Functions endpoints: `/api/feedback`, `/api/metrics`, `/api/insights`.
  - Cloudflare Workers AI: `env.AI.run()` in `/functions/api/insights.ts`.
  - Cloudflare D1: `env.ANALYTICS_DB` used in `/functions/api/metrics.ts`.

# Repository Structure
- Complete file tree as it exists now:
```
.
├── README.md
├── bun.lockb
├── components.json
├── eslint.config.js
├── index.html
├── package-lock.json
├── package.json
├── postcss.config.js
├── public
│   ├── favicon.ico
│   ├── placeholder.svg
│   └── robots.txt
├── scripts
│   └── seed-d1.sql
├── migrations
│   └── 0001_init.sql
├── functions
│   └── api
│       ├── feedback.ts
│       ├── insights.ts
│       └── metrics.ts
├── src
│   ├── App.css
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   ├── vite-env.d.ts
│   ├── worker.ts
│   ├── components
│   │   ├── NavLink.tsx
│   │   ├── dashboard
│   │   │   ├── AIInsights.tsx
│   │   │   ├── CategoryChart.tsx
│   │   │   ├── EmergingThemesCard.tsx
│   │   │   ├── FeedbackDetail.tsx
│   │   │   ├── FeedbackTable.tsx
│   │   │   ├── FilterBar.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── KpiCard.tsx
│   │   │   ├── KpiStrip.tsx
│   │   │   ├── MetricCard.tsx
│   │   │   ├── SentimentChart.tsx
│   │   │   └── SourceDistribution.tsx
│   │   └── ui
│   │       ├── accordion.tsx
│   │       ├── alert-dialog.tsx
│   │       ├── alert.tsx
│   │       ├── aspect-ratio.tsx
│   │       ├── avatar.tsx
│   │       ├── badge.tsx
│   │       ├── breadcrumb.tsx
│   │       ├── button.tsx
│   │       ├── calendar.tsx
│   │       ├── card.tsx
│   │       ├── carousel.tsx
│   │       ├── chart.tsx
│   │       ├── checkbox.tsx
│   │       ├── collapsible.tsx
│   │       ├── command.tsx
│   │       ├── context-menu.tsx
│   │       ├── dialog.tsx
│   │       ├── drawer.tsx
│   │       ├── dropdown-menu.tsx
│   │       ├── form.tsx
│   │       ├── hover-card.tsx
│   │       ├── input-otp.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── menubar.tsx
│   │       ├── navigation-menu.tsx
│   │       ├── pagination.tsx
│   │       ├── popover.tsx
│   │       ├── progress.tsx
│   │       ├── radio-group.tsx
│   │       ├── resizable.tsx
│   │       ├── scroll-area.tsx
│   │       ├── select.tsx
│   │       ├── separator.tsx
│   │       ├── sheet.tsx
│   │       ├── sidebar.tsx
│   │       ├── skeleton.tsx
│   │       ├── slider.tsx
│   │       ├── sonner.tsx
│   │       ├── switch.tsx
│   │       ├── table.tsx
│   │       ├── tabs.tsx
│   │       ├── textarea.tsx
│   │       ├── toast.tsx
│   │       ├── toaster.tsx
│   │       ├── toggle-group.tsx
│   │       ├── toggle.tsx
│   │       ├── tooltip.tsx
│   │       └── use-toast.ts
│   ├── data
│   │   └── mockFeedback.ts
│   ├── hooks
│   │   ├── useDashboardKpis.ts
│   │   ├── use-mobile.tsx
│   │   └── use-toast.ts
│   ├── lib
│   │   ├── apiClient.ts
│   │   ├── kpiUtils.ts
│   │   └── utils.ts
│   ├── pages
│   │   ├── Index.tsx
│   │   ├── NotFound.tsx
│   │   └── Themes.tsx
│   ├── test
│   │   ├── example.test.ts
│   │   └── setup.ts
│   └── utils
│       └── emergingThemes.ts
├── tailwind.config.ts
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── vitest.config.ts
└── wrangler.toml
```

- Per-file details:
  - `README.md`
    - Purpose: Project documentation (this file).
    - Key exports: N/A.
    - Critical assumptions or invariants: Must reflect current repo state.
  - `package.json`
    - Purpose: Project metadata, scripts, dependencies.
    - Key exports: N/A.
    - Critical assumptions: Scripts and dependencies match runtime expectations.
  - `package-lock.json`
    - Purpose: Dependency lockfile for npm.
    - Key exports: N/A.
    - Critical assumptions: Must stay in sync with `package.json`.
  - `bun.lockb`
    - Purpose: Bun lockfile.
    - Key exports: N/A.
    - Critical assumptions: Only relevant if using Bun.
  - `index.html`
    - Purpose: Vite HTML entry point, meta tags, font preload.
    - Key exports: N/A.
    - Critical assumptions: Root element `#root` exists for React.
  - `components.json`
    - Purpose: shadcn/ui configuration and aliases.
    - Key exports: N/A.
    - Critical assumptions: Aliases map to actual paths.
  - `postcss.config.js`
    - Purpose: PostCSS config (Tailwind + autoprefixer).
    - Key exports: default config object.
    - Critical assumptions: Tailwind CSS is available.
  - `tailwind.config.ts`
    - Purpose: Tailwind theme, colors, animations, container settings.
    - Key exports: default Tailwind config object.
    - Critical assumptions: CSS variables in `src/index.css` match Tailwind references.
  - `vite.config.ts`
    - Purpose: Vite configuration with React SWC and path alias `@`.
    - Key exports: default config via `defineConfig`.
    - Critical assumptions: `@` alias matches `./src`.
  - `vitest.config.ts`
    - Purpose: Vitest configuration.
    - Key exports: default config via `defineConfig`.
    - Critical assumptions: `src/test/setup.ts` exists and jsdom environment is used.
  - `eslint.config.js`
    - Purpose: ESLint config for TS/React.
    - Key exports: default config.
    - Critical assumptions: ESLint ignores `dist` and uses React Hooks rules.
  - `tsconfig.json`
    - Purpose: TS project references and base paths.
    - Key exports: N/A.
    - Critical assumptions: `@/*` resolves to `src/*`.
  - `tsconfig.app.json`
    - Purpose: TS config for app build.
    - Key exports: N/A.
    - Critical assumptions: `strict` disabled; JSX is `react-jsx`.
  - `tsconfig.node.json`
    - Purpose: TS config for Vite config build.
    - Key exports: N/A.
    - Critical assumptions: `vite.config.ts` is included.
  - `wrangler.toml`
    - Purpose: Cloudflare Pages/Workers configuration.
    - Key exports: N/A.
    - Critical assumptions: D1 database ID and name are correct; Pages output is `./dist`.
  - `migrations/0001_init.sql`
    - Purpose: Create `feedback_metrics` table in D1.
    - Key exports: N/A.
    - Critical assumptions: Table schema matches metrics insert in `functions/api/metrics.ts`.
  - `scripts/seed-d1.sql`
    - Purpose: Seed `feedback_metrics` with a sample row.
    - Key exports: N/A.
    - Critical assumptions: D1 database exists and schema matches.
  - `public/favicon.ico`
    - Purpose: Site favicon.
    - Key exports: N/A.
    - Critical assumptions: None.
  - `public/placeholder.svg`
    - Purpose: Placeholder asset.
    - Key exports: N/A.
    - Critical assumptions: None.
  - `public/robots.txt`
    - Purpose: Robots directives.
    - Key exports: N/A.
    - Critical assumptions: None.
  - `functions/api/feedback.ts`
    - Purpose: Pages Function to return mock feedback as JSON.
    - Key exports: `onRequest`.
    - Critical assumptions: `mockFeedback` is available and timestamps can be serialized.
  - `functions/api/metrics.ts`
    - Purpose: Pages Function to compute metrics from mock feedback and upsert into D1.
    - Key exports: `onRequest`.
    - Critical assumptions: D1 binding `ANALYTICS_DB` exists and table schema matches.
  - `functions/api/insights.ts`
    - Purpose: Pages Function to return AI insights using Workers AI (with fallback logic).
    - Key exports: `onRequest`.
    - Critical assumptions: `env.AI` exists in production; fallback works without AI.
  - `src/App.tsx`
    - Purpose: App root with router, react-query provider, and UI providers.
    - Key exports: default `App` component.
    - Critical assumptions: Routes `/, /themes, *` exist.
  - `src/main.tsx`
    - Purpose: React app bootstrap.
    - Key exports: N/A.
    - Critical assumptions: `#root` exists in `index.html`.
  - `src/App.css`
    - Purpose: Legacy Vite styles (largely unused with Tailwind).
    - Key exports: N/A.
    - Critical assumptions: None.
  - `src/index.css`
    - Purpose: Tailwind base + design system CSS variables and utilities.
    - Key exports: N/A.
    - Critical assumptions: CSS variables are used by Tailwind theme config.
  - `src/vite-env.d.ts`
    - Purpose: Vite environment typings.
    - Key exports: N/A.
    - Critical assumptions: Standard Vite types.
  - `src/worker.ts`
    - Purpose: Cloudflare Worker script (legacy or alternative to Pages Functions).
    - Key exports: default `fetch` handler.
    - Critical assumptions: `env.AI`, `env.ANALYTICS_DB`, `env.ASSETS` bindings exist when used.
  - `src/pages/Index.tsx`
    - Purpose: Overview dashboard page.
    - Key exports: default `Index` component.
    - Critical assumptions: Feedback items contain timestamps as `Date` objects; filtering is client-side.
  - `src/pages/Themes.tsx`
    - Purpose: Themes placeholder page.
    - Key exports: default `Themes` component.
    - Critical assumptions: `theme_id` may be provided via query string.
  - `src/pages/NotFound.tsx`
    - Purpose: Catch-all 404 page.
    - Key exports: default `NotFound` component.
    - Critical assumptions: Logs missing route to console.
  - `src/data/mockFeedback.ts`
    - Purpose: Mock feedback data generation and configuration maps.
    - Key exports: `mockFeedback`, `FeedbackItem` types, and config maps (sourceConfig, sentimentConfig, urgencyConfig, issueTypeConfig).
    - Critical assumptions: Generates 6000 items with timestamps across the last 2 years; issue types and sources are fixed enums.
  - `src/lib/apiClient.ts`
    - Purpose: API client for `/api/feedback`, `/api/themes`, `/api/trends`.
    - Key exports: `apiClient`, `Entry`, `Theme`, `Trends`, `EntriesParams`, `EntriesResponse`.
    - Critical assumptions: `/api/feedback` returns array or `{ items }`; `/api/themes` and `/api/trends` may not exist and return null.
  - `src/lib/kpiUtils.ts`
    - Purpose: KPI filter types and utilities for KPIs.
    - Key exports: `KpiFilters`, `applyEntryFilters`, `computeNegativePercentage`, `computeCriticalPercentage`, `computeTopIssueType`, `formatPercent`, etc.
    - Critical assumptions: Filters are optional; timestamps can be parsed with `new Date`.
  - `src/lib/utils.ts`
    - Purpose: `cn` className utility.
    - Key exports: `cn`.
    - Critical assumptions: Uses clsx and tailwind-merge.
  - `src/hooks/useDashboardKpis.ts`
    - Purpose: Fetch and compute KPI values, optionally using provided entries override.
    - Key exports: `useDashboardKpis` hook.
    - Critical assumptions: If `entriesOverride` is supplied, no network calls are made.
  - `src/hooks/use-toast.ts`
    - Purpose: Toast state management.
    - Key exports: `useToast`, `toast`, `reducer`.
    - Critical assumptions: Single-toast limit and long removal delay.
  - `src/hooks/use-mobile.tsx`
    - Purpose: Mobile breakpoint hook.
    - Key exports: `useIsMobile`.
    - Critical assumptions: Window is available (client-only).
  - `src/utils/emergingThemes.ts`
    - Purpose: Client-side emerging theme detection algorithm.
    - Key exports: `computeEmergingThemes`, `normalizeUrgency`, `normalizeSentiment`, `parseTimestampSafe` and types.
    - Critical assumptions: Entries contain timestamps; if not, falls back to theme trend flags.
  - `src/components/NavLink.tsx`
    - Purpose: React Router `NavLink` compatibility wrapper.
    - Key exports: `NavLink`.
    - Critical assumptions: Uses React Router `NavLink` className callback.
  - `src/components/dashboard/Header.tsx`
    - Purpose: Top header with search input and refresh/notification buttons.
    - Key exports: `Header`.
    - Critical assumptions: `onSearch` and `onRefresh` callbacks are provided.
  - `src/components/dashboard/FilterBar.tsx`
    - Purpose: Filter strip for Source and Time.
    - Key exports: `FilterBar`.
    - Critical assumptions: Only source and time filters are supported (no urgency filter).
  - `src/components/dashboard/KpiCard.tsx`
    - Purpose: Reusable KPI card UI.
    - Key exports: `KpiCard`.
    - Critical assumptions: `valueHidden` controls reserved space for value; tooltip uses `TooltipProvider`.
  - `src/components/dashboard/KpiStrip.tsx`
    - Purpose: KPI layout row with Ticket Counter, Issue Types, and extra cards.
    - Key exports: `KpiStrip`.
    - Critical assumptions: `entries` override is provided for client-side KPI computation; pie chart click should map to source filter.
  - `src/components/dashboard/EmergingThemesCard.tsx`
    - Purpose: Emerging Issues list card.
    - Key exports: `EmergingThemesCard`.
    - Critical assumptions: `themes` is a list of computed emerging themes; tooltip text describes urgency delta.
  - `src/components/dashboard/AIInsights.tsx`
    - Purpose: Display AI insights from `/api/insights` with fallback data.
    - Key exports: `AIInsights`.
    - Critical assumptions: Filters out insight titled "Critical Issues"; relies on `/api/insights` optionally.
  - `src/components/dashboard/FeedbackTable.tsx`
    - Purpose: Paginated feedback table with row selection.
    - Key exports: `FeedbackTable`.
    - Critical assumptions: `feedback` is pre-filtered; pagination is client-side.
  - `src/components/dashboard/FeedbackDetail.tsx`
    - Purpose: Modal showing details for a selected feedback item.
    - Key exports: `FeedbackDetail`.
    - Critical assumptions: `item` is `null` when closed; `onResolve` marks resolved status in caller.
  - `src/components/dashboard/CategoryChart.tsx`
    - Purpose: Issue type distribution chart (bar chart).
    - Key exports: `CategoryChart`.
    - Critical assumptions: `issueTypeConfig` labels map to issue types.
  - `src/components/dashboard/SentimentChart.tsx`
    - Purpose: Sentiment distribution pie chart.
    - Key exports: `SentimentChart`.
    - Critical assumptions: `feedback` has `sentiment` field.
  - `src/components/dashboard/SourceDistribution.tsx`
    - Purpose: Source distribution list with progress bars.
    - Key exports: `SourceDistribution`.
    - Critical assumptions: `sourceConfig` covers all sources present.
  - `src/components/dashboard/MetricCard.tsx`
    - Purpose: Generic metric card (older KPI style).
    - Key exports: `MetricCard`.
    - Critical assumptions: `trend` optional.
  - `src/components/ui/accordion.tsx`
    - Purpose: UNKNOWN (not inspected); filename suggests a UI accordion.
    - Key exports: UNKNOWN.
    - Critical assumptions: UNKNOWN.
  - `src/components/ui/alert-dialog.tsx`
    - Purpose: UNKNOWN (not inspected); filename suggests a UI alert dialog.
    - Key exports: UNKNOWN.
    - Critical assumptions: UNKNOWN.
  - `src/components/ui/alert.tsx`
    - Purpose: UNKNOWN (not inspected); filename suggests a UI alert.
    - Key exports: UNKNOWN.
    - Critical assumptions: UNKNOWN.
  - `src/components/ui/aspect-ratio.tsx`
    - Purpose: UNKNOWN (not inspected); filename suggests an aspect ratio wrapper.
    - Key exports: UNKNOWN.
    - Critical assumptions: UNKNOWN.
  - `src/components/ui/avatar.tsx`
    - Purpose: UNKNOWN (not inspected); filename suggests an avatar component.
    - Key exports: UNKNOWN.
    - Critical assumptions: UNKNOWN.
  - `src/components/ui/badge.tsx`
    - Purpose: UNKNOWN (not inspected); filename suggests a badge component.
    - Key exports: UNKNOWN.
    - Critical assumptions: UNKNOWN.
  - `src/components/ui/breadcrumb.tsx`
    - Purpose: UNKNOWN (not inspected); filename suggests a breadcrumb component.
    - Key exports: UNKNOWN.
    - Critical assumptions: UNKNOWN.
  - `src/components/ui/button.tsx`
    - Purpose: UNKNOWN (not inspected); filename suggests a button component.
    - Key exports: UNKNOWN.
    - Critical assumptions: UNKNOWN.
  - `src/components/ui/calendar.tsx`
    - Purpose: UNKNOWN (not inspected); filename suggests a calendar component.
    - Key exports: UNKNOWN.
    - Critical assumptions: UNKNOWN.
  - `src/components/ui/card.tsx`
    - Purpose: UNKNOWN (not inspected); filename suggests a card component.
    - Key exports: UNKNOWN.
    - Critical assumptions: UNKNOWN.
  - `src/components/ui/carousel.tsx`
    - Purpose: UNKNOWN (not inspected); filename suggests a carousel component.
    - Key exports: UNKNOWN.
    - Critical assumptions: UNKNOWN.
  - `src/components/ui/chart.tsx`
    - Purpose: UNKNOWN (not inspected); filename suggests a chart wrapper.
    - Key exports: UNKNOWN.
    - Critical assumptions: UNKNOWN.
  - `src/components/ui/checkbox.tsx`
    - Purpose: UNKNOWN (not inspected); filename suggests a checkbox component.
    - Key exports: UNKNOWN.
    - Critical assumptions: UNKNOWN.
  - `src/components/ui/collapsible.tsx`
    - Purpose: UNKNOWN (not inspected); filename suggests a collapsible component.
    - Key exports: UNKNOWN.
    - Critical assumptions: UNKNOWN.
  - `src/components/ui/command.tsx`
    - Purpose: UNKNOWN (not inspected); filename suggests a command palette component.
    - Key exports: UNKNOWN.
    - Critical assumptions: UNKNOWN.
  - `src/components/ui/context-menu.tsx`
    - Purpose: UNKNOWN (not inspected); filename suggests a context menu.
    - Key exports: UNKNOWN.
    - Critical assumptions: UNKNOWN.
  - `src/components/ui/dialog.tsx`
    - Purpose: UNKNOWN (not inspected); filename suggests a dialog component.
    - Key exports: UNKNOWN.
    - Critical assumptions: UNKNOWN.
  - `src/components/ui/drawer.tsx`
    - Purpose: UNKNOWN (not inspected); filename suggests a drawer component.
    - Key exports: UNKNOWN.
    - Critical assumptions: UNKNOWN.
  - `src/components/ui/dropdown-menu.tsx`
    - Purpose: UNKNOWN (not inspected); filename suggests a dropdown menu.
    - Key exports: UNKNOWN.
    - Critical assumptions: UNKNOWN.
  - `src/components/ui/form.tsx`
    - Purpose: UNKNOWN (not inspected); filename suggests form helpers.
    - Key exports: UNKNOWN.
    - Critical assumptions: UNKNOWN.
  - `src/components/ui/hover-card.tsx`
    - Purpose: UNKNOWN (not inspected); filename suggests hover card component.
    - Key exports: UNKNOWN.
    - Critical assumptions: UNKNOWN.
  - `src/components/ui/input-otp.tsx`
    - Purpose: UNKNOWN (not inspected); filename suggests OTP input.
    - Key exports: UNKNOWN.
    - Critical assumptions: UNKNOWN.
  - `src/components/ui/input.tsx`
    - Purpose: UNKNOWN (not inspected); filename suggests input component.
    - Key exports: UNKNOWN.
    - Critical assumptions: UNKNOWN.
  - `src/components/ui/label.tsx`
    - Purpose: UNKNOWN (not inspected); filename suggests label component.
    - Key exports: UNKNOWN.
    - Critical assumptions: UNKNOWN.
  - `src/components/ui/menubar.tsx`
    - Purpose: UNKNOWN (not inspected); filename suggests menubar component.
    - Key exports: UNKNOWN.
    - Critical assumptions: UNKNOWN.
  - `src/components/ui/navigation-menu.tsx`
    - Purpose: UNKNOWN (not inspected); filename suggests navigation menu component.
    - Key exports: UNKNOWN.
    - Critical assumptions: UNKNOWN.
  - `src/components/ui/pagination.tsx`
    - Purpose: UNKNOWN (not inspected); filename suggests pagination primitives.
    - Key exports: UNKNOWN.
    - Critical assumptions: UNKNOWN.
  - `src/components/ui/popover.tsx`
    - Purpose: UNKNOWN (not inspected); filename suggests popover component.
    - Key exports: UNKNOWN.
    - Critical assumptions: UNKNOWN.
  - `src/components/ui/progress.tsx`
    - Purpose: UNKNOWN (not inspected); filename suggests progress component.
    - Key exports: UNKNOWN.
    - Critical assumptions: UNKNOWN.
  - `src/components/ui/radio-group.tsx`
    - Purpose: UNKNOWN (not inspected); filename suggests radio group component.
    - Key exports: UNKNOWN.
    - Critical assumptions: UNKNOWN.
  - `src/components/ui/resizable.tsx`
    - Purpose: UNKNOWN (not inspected); filename suggests resizable panels.
    - Key exports: UNKNOWN.
    - Critical assumptions: UNKNOWN.
  - `src/components/ui/scroll-area.tsx`
    - Purpose: UNKNOWN (not inspected); filename suggests scroll area component.
    - Key exports: UNKNOWN.
    - Critical assumptions: UNKNOWN.
  - `src/components/ui/select.tsx`
    - Purpose: UNKNOWN (not inspected); filename suggests select component.
    - Key exports: UNKNOWN.
    - Critical assumptions: UNKNOWN.
  - `src/components/ui/separator.tsx`
    - Purpose: UNKNOWN (not inspected); filename suggests separator component.
    - Key exports: UNKNOWN.
    - Critical assumptions: UNKNOWN.
  - `src/components/ui/sheet.tsx`
    - Purpose: UNKNOWN (not inspected); filename suggests sheet component.
    - Key exports: UNKNOWN.
    - Critical assumptions: UNKNOWN.
  - `src/components/ui/sidebar.tsx`
    - Purpose: UNKNOWN (not inspected); filename suggests sidebar component.
    - Key exports: UNKNOWN.
    - Critical assumptions: UNKNOWN.
  - `src/components/ui/skeleton.tsx`
    - Purpose: UNKNOWN (not inspected); filename suggests skeleton/loading component.
    - Key exports: UNKNOWN.
    - Critical assumptions: UNKNOWN.
  - `src/components/ui/slider.tsx`
    - Purpose: UNKNOWN (not inspected); filename suggests slider component.
    - Key exports: UNKNOWN.
    - Critical assumptions: UNKNOWN.
  - `src/components/ui/sonner.tsx`
    - Purpose: UNKNOWN (not inspected); filename suggests Sonner toast adapter.
    - Key exports: UNKNOWN.
    - Critical assumptions: UNKNOWN.
  - `src/components/ui/switch.tsx`
    - Purpose: UNKNOWN (not inspected); filename suggests switch component.
    - Key exports: UNKNOWN.
    - Critical assumptions: UNKNOWN.
  - `src/components/ui/table.tsx`
    - Purpose: UNKNOWN (not inspected); filename suggests table component.
    - Key exports: UNKNOWN.
    - Critical assumptions: UNKNOWN.
  - `src/components/ui/tabs.tsx`
    - Purpose: UNKNOWN (not inspected); filename suggests tabs component.
    - Key exports: UNKNOWN.
    - Critical assumptions: UNKNOWN.
  - `src/components/ui/textarea.tsx`
    - Purpose: UNKNOWN (not inspected); filename suggests textarea component.
    - Key exports: UNKNOWN.
    - Critical assumptions: UNKNOWN.
  - `src/components/ui/toast.tsx`
    - Purpose: UNKNOWN (not inspected); filename suggests toast component.
    - Key exports: UNKNOWN.
    - Critical assumptions: UNKNOWN.
  - `src/components/ui/toaster.tsx`
    - Purpose: UNKNOWN (not inspected); filename suggests toast container.
    - Key exports: UNKNOWN.
    - Critical assumptions: UNKNOWN.
  - `src/components/ui/toggle-group.tsx`
    - Purpose: UNKNOWN (not inspected); filename suggests toggle group.
    - Key exports: UNKNOWN.
    - Critical assumptions: UNKNOWN.
  - `src/components/ui/toggle.tsx`
    - Purpose: UNKNOWN (not inspected); filename suggests toggle component.
    - Key exports: UNKNOWN.
    - Critical assumptions: UNKNOWN.
  - `src/components/ui/tooltip.tsx`
    - Purpose: Radix tooltip wrapper with portal and high z-index.
    - Key exports: `TooltipProvider`, `Tooltip`, `TooltipTrigger`, `TooltipContent`.
    - Critical assumptions: Tooltip content is rendered in a portal with `z-[200]`.
  - `src/components/ui/use-toast.ts`
    - Purpose: UNKNOWN (not inspected); filename suggests toast utilities.
    - Key exports: UNKNOWN.
    - Critical assumptions: UNKNOWN.
  - `src/test/setup.ts`
    - Purpose: Test setup for jsdom matchMedia.
    - Key exports: N/A.
    - Critical assumptions: Tests rely on matchMedia presence.
  - `src/test/example.test.ts`
    - Purpose: Example test.
    - Key exports: N/A.
    - Critical assumptions: None.

# Implementation Details
- Core business logic (explicit algorithms and rules):
  - Mock feedback generation (`src/data/mockFeedback.ts`):
    - Generates 6000 entries using a deterministic linear congruential generator (seed = 42).
    - Distributes entries across 6 sources with minimum 400 per source.
    - Distributes issue types via randomized queue so counts are not evenly split.
    - Timestamps are spread across the last 2 years, with additional recency skew for `performance` and `bug` issue types to create emerging trends.
  - Client-side filtering (`src/pages/Index.tsx`):
    - Filters by search text (matches title/content/author), source filter, and time window (24h/7d/30d/all).
  - KPI computation (`src/hooks/useDashboardKpis.ts` and `src/lib/kpiUtils.ts`):
    - Uses `applyEntryFilters` to apply filters to entries.
    - Computes total entries, critical percentage, top issue type, etc., from filtered data.
  - Emerging theme detection (`src/utils/emergingThemes.ts`):
    - Compares last N days vs previous N days.
    - Flags a theme as emerging if it meets min volume and either new, volume spike, or urgency escalation criteria.
    - Computes a score for ranking and returns top K (default 5, Index passes 2).
  - AI insights (`functions/api/insights.ts`, `src/components/dashboard/AIInsights.tsx`):
    - Server uses Workers AI when available, otherwise returns a deterministic fallback.
    - Client filters out the "Critical Issues" insight so the KPI card owns that content.
- State management approach:
  - Local component state via React `useState` in `Index.tsx`.
  - Derived data via `useMemo`.
  - No global state store.
- Error handling behavior:
  - `Index.tsx` falls back to local mock data if `/api/feedback` fails.
  - `useDashboardKpis` sets an error message if API calls fail.
  - `AIInsights` falls back to local insights if `/api/insights` fails.
- Edge cases handled:
  - Filtering functions handle missing fields (safe normalization).
  - Emerging themes computation ignores entries without timestamps.
  - KPI values display `—` when data is missing.
- Performance considerations already implemented:
  - `useMemo` for filtered lists, KPI calculations, and aggregated counts.
  - KPI data fetch uses a fixed `page_size=1000` (but currently bypassed via entries override).

# Key Decisions & Constraints
- Architectural decisions and rationale:
  - Use Cloudflare Pages Functions for mock APIs to simplify deployment and keep the UI static.
  - Keep KPI computation client-side for now, with hooks structured to allow server-side aggregation later.
  - Use a deterministic mock data generator so the dataset is stable across runs.
- Trade-offs accepted:
  - Client-side filtering and KPI computation may be heavy for very large datasets.
  - API endpoints `/api/themes` and `/api/trends` are referenced but not implemented yet.
- Hard constraints that MUST NOT be violated in future changes:
  - Do not introduce R2 or other storage; only D1 is intended here.
  - Do not remove or rename `issueType` fields without updating all references.
  - Maintain the current visual design language (glass cards, Tailwind tokens).

# Current Project State
- Fully working features:
  - Dashboard layout with header, filter bar, KPI cards, AI insights, and feedback table.
  - Client-side filtering by source, search, and time.
  - Pagination and page size selection in the feedback table.
  - Emerging issues list computed client-side.
  - AI insights fallback if Workers AI is unavailable.
- Partially implemented features:
  - KPI hook supports `/api/themes` and `/api/trends` but these endpoints are not implemented.
  - D1 metrics are computed by `/api/metrics` but not surfaced in the UI.
  - `src/worker.ts` contains Worker logic but is not wired into Pages.
- Broken or unimplemented features:
  - Pie chart slice clicks are reported to not apply the Source filter (legend clicks work).
  - Emerging Issues tooltip is reported to be hidden behind the AI Insights card (stacking issue persists).
  - Issue Types bar chart centering is reported to be incorrect in the current layout.

# Open Tasks (Priority Order)
1) Fix pie chart slice click behavior
   - Description: Clicking a slice should update the Source filter, same as clicking the legend.
   - Intended behavior: Both legend text and pie slices update the active Source filter.
   - Relevant files: `src/components/dashboard/KpiStrip.tsx`, `src/pages/Index.tsx`.
   - Known pitfalls or context: Recharts click event payload may differ between Pie and PieChart; ensure consistent mapping of `source`.
2) Resolve Emerging Issues tooltip stacking
   - Description: Tooltip content should appear above adjacent KPI cards.
   - Intended behavior: Tooltip is fully visible and not clipped or hidden.
   - Relevant files: `src/components/dashboard/EmergingThemesCard.tsx`, `src/components/ui/tooltip.tsx`.
   - Known pitfalls or context: Tooltip should render in a portal with sufficient z-index; container overflow may clip.
3) Center Issue Types bar chart correctly
   - Description: Center bar chart relative to the header row in the Issue Types card.
   - Intended behavior: Bars are visually centered within the card, not only within an inner wrapper.
   - Relevant files: `src/components/dashboard/KpiStrip.tsx`.
   - Known pitfalls or context: Nested layout with `space-y-2` and flex containers may offset alignment.
4) Implement `/api/themes` and `/api/trends`
   - Description: Provide endpoints or remove the calls if unnecessary.
   - Intended behavior: KPI hook can fetch themes/trends without errors.
   - Relevant files: `functions/api/*`, `src/lib/apiClient.ts`, `src/hooks/useDashboardKpis.ts`.
   - Known pitfalls or context: Ensure Pages Functions routing and Typescript types match.

# Known Issues & Risks
- Bugs:
  - Pie slice click does not always trigger source filter updates (reported across browsers).
  - Emerging Issues tooltip can be hidden by adjacent cards despite tooltip portal.
- Technical debt:
  - `src/worker.ts` duplicates Pages Functions behavior but is not wired into Pages.
  - API client references endpoints that do not exist.
- Ambiguities:
  - Whether KPI calculations should be purely client-side or server-side aggregates in the future.
- Assumptions that may be incorrect:
  - The time filter in `Index.tsx` is applied uniformly for all KPI and emerging theme calculations; currently emerging themes use a derived windowDays but do not apply the time filter to the dataset first.

# Rules for Future Development
- Coding standards to follow:
  - Keep changes consistent with existing Tailwind and shadcn/ui patterns.
  - Prefer `useMemo` and safe parsing for data-heavy computations.
- Things future Codex sessions must NEVER do:
  - Do not add R2 or other Cloudflare storage products.
  - Do not remove mock data or replace it with real integrations unless explicitly requested.
- Things future Codex sessions must ALWAYS do:
  - Keep KPI and emerging theme logic resilient to missing fields.
  - Maintain client-side filtering unless a server-side switch is explicitly planned.

# Continuation Instructions
- Exact next task to work on: Fix pie chart slice click so it applies the Source filter consistently.
- Preconditions before starting:
  - Run `npm install`.
  - Start the dev server with `npm run dev`.
  - Open the dashboard and reproduce the issue by clicking pie slices.
- Expected outcome of the next task:
  - Clicking any pie slice updates the Source filter in the filter bar and re-computes KPIs and the table.
