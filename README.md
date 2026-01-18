# Project Overview
- Project name: admin-canvas (Feedback Hub)
- One-line goal: A client-side analytics dashboard for product feedback with KPI cards, trends, filters, and AI insight overlays backed by mock data and Cloudflare Pages/Workers endpoints.
- Explicit non-goals / out-of-scope items:
  - No real third-party integrations (data is mock or Cloudflare AI fallback only).
  - No authentication or user management.
  - No server-side rendering (SPA only).
  - No persistent CRUD UI for feedback items.
  - No production analytics pipeline; D1 is used only for demo metrics writes.

# Tech Stack
- Language(s): TypeScript, JavaScript, SQL (D1 migrations)
- Framework(s): React 18, Vite
- Libraries / SDKs:
  - UI: Tailwind CSS, shadcn/ui (Radix UI), lucide-react
  - Charts: Recharts
  - Date utilities: date-fns, react-day-picker
  - State/data: React Query (setup only), React Router
  - Form/tools: react-hook-form, zod
  - Others: class-variance-authority, clsx, tailwind-merge
- Database / storage:
  - Cloudflare D1 (metrics writes in Pages Functions and Worker)
- Infrastructure / hosting:
  - Cloudflare Pages Functions (functions/api/*)
  - Cloudflare Worker (src/worker.ts) with assets binding
  - Wrangler (wrangler.toml)
- Auth (if any): None
- AI / ML components (if any): Cloudflare Workers AI (`@cf/meta/llama-3-8b-instruct`) used in `/api/insights` (fallback to static insights if not available)

# Architecture
- High-level components:
  - SPA frontend (React) for dashboard UI and interactions.
  - Mock data generator used by frontend and API handlers.
  - Cloudflare Pages Functions for `/api/feedback`, `/api/metrics`, `/api/insights`.
  - Optional Worker (`src/worker.ts`) implementing similar endpoints and static asset fallback.
- Responsibility of each component:
  - `src/pages/Index.tsx`: main dashboard orchestration, state/filters, KPIs, Trends chart, overlays.
  - `src/components/dashboard/*`: visual components for KPIs, trends, filters, tables, overlays.
  - `src/data/mockFeedback.ts`: mock data generator and config dictionaries for sources/urgency/sentiment/issue types.
  - `functions/api/*`: Pages Functions serving JSON using mock data, writing metrics to D1, and invoking Workers AI.
  - `src/worker.ts`: standalone Worker implementing the same API and serving static assets.
- End-to-end data flow (step-by-step):
  1) App mounts at `/` (`src/pages/Index.tsx`).
  2) `loadFeedback()` fetches `/api/feedback`; if it fails, falls back to `mockFeedback`.
  3) Feedback entries are indexed (lowercased search text + timestampMs) for faster filtering.
  4) Global filters (Source/Time/Search) update `filteredFeedback`, which drives the KPI strip, table, and trend charts.
  5) Trends chart uses local time granularity synced to global time filter and can apply custom range via drag selection.
  6) Clicking AI Insights button opens an overlay over the Trends chart and renders `AIInsights` + `EmergingThemesCard` inside.
  7) Pages Functions endpoints return JSON and (for `/api/metrics`) update D1.
- External integrations (APIs, services, webhooks):
  - Cloudflare Workers AI binding used in `functions/api/insights.ts` and `src/worker.ts` (if configured).
  - D1 database binding `ANALYTICS_DB` used in `functions/api/metrics.ts` and `src/worker.ts`.
  - `/api/themes` and `/api/trends` are referenced by `apiClient` but not implemented in this repo (expected to return null/404).

# Repository Structure
- Top-level tree:
  - `.git/`: Git metadata (not documented here).
  - `.wrangler/`: Wrangler state (generated).
  - `dist/`: Build output (generated).
  - `node_modules/`: Dependency tree (generated; contents correspond to `package.json`/`package-lock.json`).
  - `functions/`: Cloudflare Pages Functions.
  - `migrations/`: D1 schema migrations.
  - `public/`: Static assets.
  - `scripts/`: D1 seed script.
  - `src/`: Application source code.
  - Config files: `package.json`, `tsconfig*.json`, `vite.config.ts`, `tailwind.config.ts`, `postcss.config.js`, `eslint.config.js`, `wrangler.toml`, `components.json`, `index.html`.

- File-by-file details:
  - `README.md`: Project documentation (this file). No runtime exports.
  - `package.json`: Project metadata, scripts, and dependencies. Key scripts: `dev`, `build`, `seed:d1`, `test`.
  - `package-lock.json`: NPM lockfile. Assumes `npm install` for exact deps.
  - `bun.lockb`: Bun lockfile (unused unless Bun is used).
  - `index.html`: Vite HTML entrypoint with `#root` mount.
  - `vite.config.ts`: Vite config with React SWC plugin.
  - `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`: TypeScript configs.
  - `tailwind.config.ts`: Tailwind config with typography + animations.
  - `postcss.config.js`: PostCSS config with Tailwind + autoprefixer.
  - `eslint.config.js`: ESLint config.
  - `components.json`: shadcn/ui component registry config.
  - `wrangler.toml`: Cloudflare Worker/Pages config (bindings, compatibility date) (values not described here).
  - `public/favicon.ico`: Favicon.
  - `public/robots.txt`: Robots file.
  - `public/placeholder.svg`: Placeholder asset.
  - `migrations/0001_init.sql`: D1 schema for `feedback_metrics` table.
  - `scripts/seed-d1.sql`: D1 seed script for metrics table.

  - `functions/api/feedback.ts`:
    - Purpose: Serve feedback JSON via Pages Functions.
    - Exports: `onRequest` (PagesFunction).
    - Assumptions: `mockFeedback` exists; timestamps are serialized to ISO.
  - `functions/api/metrics.ts`:
    - Purpose: Compute metrics from mock data and upsert into D1.
    - Exports: `onRequest`.
    - Assumptions: `env.ANALYTICS_DB` bound; table exists.
  - `functions/api/insights.ts`:
    - Purpose: Build AI insights (Workers AI if available; fallback otherwise).
    - Exports: `onRequest`.
    - Assumptions: `env.AI` binding optional; returns JSON.

  - `src/main.tsx`:
    - Purpose: React entrypoint.
    - Exports: none.
    - Invariant: `#root` exists in `index.html`.
  - `src/App.tsx`:
    - Purpose: App shell, router, query client, tooltip providers.
    - Exports: default `App`.
    - Invariant: `BrowserRouter` routes `/`, `/themes`, `*`.
  - `src/App.css`: App-level CSS (if any).
  - `src/index.css`: Tailwind base + global styles.
  - `src/vite-env.d.ts`: Vite typings.
  - `src/worker.ts`:
    - Purpose: Worker implementation of `/api/feedback`, `/api/metrics`, `/api/insights` and static asset fallback.
    - Exports: default fetch handler.
    - Invariant: `env.ANALYTICS_DB`, `env.ASSETS`, `env.AI` expected when deployed to Worker.

  - `src/pages/Index.tsx`:
    - Purpose: Main dashboard page.
    - Exports: default `Index` component.
    - Key logic: loads feedback; maintains filters; pre-indexes data; computes KPIs; renders filter bar, KPI strip, Trends card, overlay content, and Feedback table.
    - Invariants: `feedback` items have `timestamp: Date`.
  - `src/pages/Themes.tsx`:
    - Purpose: Themes page (UNKNOWN functionality; not modified in this session).
    - Exports: default `Themes` component.
  - `src/pages/NotFound.tsx`:
    - Purpose: 404 page.
    - Exports: default `NotFound` component.

  - `src/data/mockFeedback.ts`:
    - Purpose: Mock data generator and config dictionaries.
    - Exports: `FeedbackItem` type, `mockFeedback` array (~6000 entries), `sourceConfig`, `sentimentConfig`, `urgencyConfig`, `issueTypeConfig`.
    - Invariants: `timestamp` is `Date`, `issueType` is one of six categories.

  - `src/lib/apiClient.ts`:
    - Purpose: Client for `/api/feedback`, `/api/themes`, `/api/trends`.
    - Exports: types `Entry`, `Theme`, `Trends`, `EntriesParams`, `EntriesResponse`; `apiClient` with `getEntries`, `getThemes`, `getTrends`.
    - Invariants: `/api/feedback` returns array or `{items}`.

  - `src/lib/kpiUtils.ts`:
    - Purpose: KPI helpers and filters.
    - Exports: `KpiFilters`, `applyEntryFilters`, `deriveThemesFromEntries`, `computeNegativePercentage`, `computeHighCriticalCount`, `computeCriticalPercentage`, `computeTopSource`, `computeTopIssueType`, `computeEmergingThemes`, `computeEmergingThemesFromEntries`, `formatPercent`, `formatLabel`, `getTopSourceLabel`, plus normalization helpers.
    - Invariants: Accepts `Entry`/`Theme` types; timestamps may be string/Date.

  - `src/utils/emergingThemes.ts`:
    - Purpose: Client-side emerging theme detection.
    - Exports: `EmergingTheme` type, `computeEmergingThemes`, `parseTimestampSafe`, `normalizeUrgency`, `normalizeSentiment`.
    - Invariants: Uses 7-day windows by default; ignores entries without timestamps.

  - `src/hooks/useDashboardKpis.ts`:
    - Purpose: KPI data loader + computation.
    - Exports: `useDashboardKpis` hook.
    - Invariants: if `entriesOverride` provided, skips network; only computes `totalEntries` and `topIssueType` (others set to null).

  - `src/hooks/use-toast.ts`, `src/hooks/use-mobile.tsx`:
    - Purpose: shadcn hooks (toast + mobile breakpoint detection).
    - Exports: `useToast`, `toast` and `useIsMobile` (per file).

  - `src/components/NavLink.tsx`:
    - Purpose: Styled navigation link component.
    - Exports: default `NavLink` (UNKNOWN details).

  - `src/components/dashboard/Header.tsx`:
    - Purpose: Top header with search and refresh.
    - Exports: `Header`.
    - Invariants: `onSearch`/`onRefresh` callbacks required.

  - `src/components/dashboard/FilterBar.tsx`:
    - Purpose: Source/Time filters with custom range.
    - Exports: `FilterBar`.
    - Invariants: Custom range shown inline after `All` time chip when `activeTime === 'custom'`; Custom chip hidden while active.

  - `src/components/dashboard/KpiCard.tsx`:
    - Purpose: KPI card layout component with optional action slot.
    - Exports: `KpiCard`.
    - Invariants: `action` rendered in header; uses `valueHidden` to suppress main value.

  - `src/components/dashboard/KpiStrip.tsx`:
    - Purpose: KPI strip layout with Ticket Counter pie and Issue Types.
    - Exports: `KpiStrip`.
    - Invariants: Grid columns change if `secondaryCard` is null; clicking pie slices triggers `onSourceSelect`.

  - `src/components/dashboard/TrendsCard.tsx`:
    - Purpose: Trends line chart with local time granularity synced to global filter, drag selection, and AI Insights overlay.
    - Exports: `TrendsCard`.
    - Invariants: Uses Recharts; overlay closes on outside click or X; time granularity synced to global filters; highlight overlay bounded to plot area.

  - `src/components/dashboard/IssueTrendModal.tsx`:
    - Purpose: Modal trend chart opened from Emerging Issues (interaction currently disabled in card).
    - Exports: `IssueTrendModal`.
    - Invariants: Uses drag selection overlay; currently clears overlay after selection.

  - `src/components/dashboard/AIInsights.tsx`:
    - Purpose: AI insights card; supports compact layout.
    - Exports: `AIInsights`.
    - Invariants: Filters out `Critical Issues` insight; compact mode shows two cards side-by-side.

  - `src/components/dashboard/EmergingThemesCard.tsx`:
    - Purpose: Emerging Issues list.
    - Exports: `EmergingThemesCard`.
    - Invariants: No click interactions; cards rendered in two-column grid.

  - `src/components/dashboard/FeedbackTable.tsx`:
    - Purpose: Recent feedback table with pagination.
    - Exports: `FeedbackTable`.
    - Invariants: Uses `formatDistanceToNow`; page size options 10/50/100.

  - `src/components/dashboard/FeedbackDetail.tsx`:
    - Purpose: Detail modal for selected feedback item.
    - Exports: `FeedbackDetail` (UNKNOWN internals).

  - `src/components/dashboard/MetricCard.tsx`, `SentimentChart.tsx`, `SourceDistribution.tsx`, `CategoryChart.tsx`:
    - Purpose: Dashboard charts/cards (legacy/auxiliary). 
    - Exports: per component file (UNKNOWN details).

  - `src/components/ui/*` (shadcn/ui wrappers):
    - Purpose: UI primitives based on Radix UI and utility styling.
    - Exports (key):
      - `accordion.tsx`: `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent`.
      - `alert-dialog.tsx`: Radix alert dialog exports.
      - `alert.tsx`: `Alert`, `AlertTitle`, `AlertDescription`.
      - `aspect-ratio.tsx`: `AspectRatio`.
      - `avatar.tsx`: `Avatar`, `AvatarImage`, `AvatarFallback`.
      - `badge.tsx`: `Badge`, `badgeVariants`.
      - `breadcrumb.tsx`: breadcrumb components (see file for full list).
      - `button.tsx`: `Button`, `buttonVariants`, `ButtonProps`.
      - `calendar.tsx`: `Calendar`.
      - `card.tsx`: `Card`, `CardHeader`, `CardFooter`, `CardTitle`, `CardDescription`, `CardContent`.
      - `carousel.tsx`: `Carousel`, `CarouselContent`, `CarouselItem`, `CarouselPrevious`, `CarouselNext`, `CarouselApi`.
      - `chart.tsx`: `ChartContainer`, `ChartTooltip`, `ChartTooltipContent`, `ChartLegend`, `ChartLegendContent`, `ChartStyle`, `ChartConfig`.
      - `checkbox.tsx`: `Checkbox`.
      - `collapsible.tsx`: `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent`.
      - `command.tsx`: `Command`, `CommandInput`, etc. (see file for full list).
      - `context-menu.tsx`: Radix context menu exports (see file).
      - `dialog.tsx`: `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, etc.
      - `drawer.tsx`: drawer exports (see file).
      - `dropdown-menu.tsx`: dropdown exports (see file).
      - `form.tsx`: `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormDescription`, `FormMessage`, `useFormField`.
      - `hover-card.tsx`: `HoverCard`, `HoverCardTrigger`, `HoverCardContent`.
      - `input-otp.tsx`: `InputOTP`, `InputOTPGroup`, `InputOTPSlot`, `InputOTPSeparator`.
      - `input.tsx`: `Input`.
      - `label.tsx`: `Label`.
      - `menubar.tsx`: menubar exports (see file).
      - `navigation-menu.tsx`: navigation menu exports (see file).
      - `pagination.tsx`: pagination exports (see file).
      - `popover.tsx`: `Popover`, `PopoverTrigger`, `PopoverContent`.
      - `progress.tsx`: `Progress`.
      - `radio-group.tsx`: `RadioGroup`, `RadioGroupItem`.
      - `resizable.tsx`: `ResizablePanelGroup`, `ResizablePanel`, `ResizableHandle`.
      - `scroll-area.tsx`: `ScrollArea`, `ScrollBar`.
      - `select.tsx`: select exports (see file).
      - `separator.tsx`: `Separator`.
      - `sheet.tsx`: sheet exports (see file).
      - `sidebar.tsx`: sidebar exports (see file).
      - `skeleton.tsx`: `Skeleton`.
      - `slider.tsx`: `Slider`.
      - `sonner.tsx`: `Toaster`, `toast`.
      - `switch.tsx`: `Switch`.
      - `table.tsx`: table exports.
      - `tabs.tsx`: `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`.
      - `textarea.tsx`: `Textarea`.
      - `toast.tsx`: toast primitives.
      - `toaster.tsx`: `Toaster`.
      - `toggle.tsx`: `Toggle`, `toggleVariants`.
      - `toggle-group.tsx`: `ToggleGroup`, `ToggleGroupItem`.
      - `tooltip.tsx`: `Tooltip`, `TooltipTrigger`, `TooltipContent`, `TooltipProvider`.
      - `use-toast.ts`: `useToast`, `toast`.
    - Invariants: Components follow shadcn/ui + Radix patterns.

# Implementation Details
- Core business logic:
  - Feedback generation: `buildMockFeedback()` creates 6000 items, randomized over the last 2 years with skewed “emerging” issues for `performance` and `bug`.
  - Filtering: `Index.tsx` uses indexed feedback for fast search and separates base filters (search+source) from time filters.
  - KPI computations: `KpiStrip` uses `useDashboardKpis` for totals/top issue type plus local aggregation for pie chart and issue types.
  - Trend computation: `TrendsCard` buckets entries by time range and uses Recharts to plot `count` and `avgUrgency` lines.
  - Emerging themes: `computeEmergingThemes` compares current vs previous windows (default 7 days) and scores by volume/urgency/negative ratio.
- State management approach:
  - Local `useState` in `Index.tsx` for filters, selections, and overlays.
  - `useMemo` to compute filtered arrays and KPI derived values.
  - `useDeferredValue` for search input to reduce filter churn.
- Error handling behavior:
  - `/api/feedback` fetch failures fall back to `mockFeedback`.
  - AI insights fetch errors return fallback insights.
  - `apiClient` returns null for missing `/api/themes`/`/api/trends`.
- Edge cases handled:
  - Missing timestamps are ignored in emerging theme computation.
  - Empty datasets yield `—` or empty state blocks.
  - Filter reset/selection handles custom time ranges.
- Performance considerations already implemented:
  - Pre-indexed feedback for search.
  - Collapsed multiple filter passes into shared base filtered list.
  - `useDeferredValue` for search input.
  - Chart overlay and drag selection throttled with `requestAnimationFrame`.

# Key Decisions & Constraints
- Architectural decisions and rationale:
  - Client-side filtering and aggregation to keep mock data local and fast.
  - Cloudflare Pages Functions and Worker endpoints reuse mock data for consistency.
  - AI Insights overlay placed within Trends card to avoid modal navigation.
- Trade-offs accepted:
  - Large mock dataset (6000 items) can cause UI lag; mitigated by memoization and indexing.
  - `/api/themes` and `/api/trends` are not implemented; related features use fallbacks.
- Hard constraints that MUST NOT be violated in future changes:
  - Do not remove mock data fallback.
  - Keep global filters and Trends granularity in sync.
  - Avoid drastic UI redesigns outside existing design system.

# Current Project State
- Fully working features:
  - Feedback list with pagination.
  - Global Source/Time filters with custom range.
  - KPI strip with Ticket Counter pie and Issue Types.
  - Trends chart with synced granularity and drag-to-select ranges.
  - AI Insights overlay with Emerging Issues inside.
- Partially implemented features:
  - `/api/themes` and `/api/trends` are referenced but not implemented.
  - IssueTrendModal is present but its trigger was removed from Emerging Issues card.
- Broken or unimplemented features:
  - UNKNOWN: any routing beyond `/` and `/themes` (not evaluated).

# Open Tasks (Priority Order)
- Investigate residual UI lag when overlays are open and when filters change.
  - Intended behavior: smooth interaction during drag and filter changes.
  - Relevant files: `src/pages/Index.tsx`, `src/components/dashboard/TrendsCard.tsx`, `src/components/dashboard/AIInsights.tsx`.
  - Pitfalls: avoid reintroducing heavy array scans.
- Decide on `/api/themes` and `/api/trends` endpoints or remove related client calls.
  - Intended behavior: consistent API behavior without 404s.
  - Relevant files: `src/lib/apiClient.ts`, `functions/api/*`, `src/worker.ts`.
  - Pitfalls: keep backwards compatibility with existing hooks.

# Known Issues & Risks
- UI performance can still lag on lower-end devices due to large dataset and heavy charts.
- `AIInsights` uses fetch to `/api/insights`; when AI binding is unavailable, it falls back silently.
- `useDashboardKpis` no longer uses themes/trends; some KPI fields are always null by design.
- `/api/themes` and `/api/trends` not implemented in functions folder.

# Rules for Future Development
- Coding standards to follow:
  - TypeScript for all new logic.
  - Keep UI consistent with existing Tailwind + shadcn/ui patterns.
  - Prefer `useMemo` and `useDeferredValue` for derived data on large arrays.
- Things future Codex sessions must NEVER do:
  - Remove mock feedback fallback or break `/api/feedback`.
  - Introduce server-side dependencies without updating Cloudflare functions and bindings.
- Things future Codex sessions must ALWAYS do:
  - Keep global and local time filters in sync.
  - Update README when making architectural or API changes.

# Continuation Instructions
- Exact next task to work on: Investigate remaining performance bottlenecks by profiling filter interactions and the Trends overlay.
- Preconditions before starting:
  - Run `npm install` and `npm run dev`.
  - Open the dashboard and test filter interactions with 6000 mock items.
- Expected outcome of the next task:
  - Reduced interaction latency during filter changes and overlay use without regressions in chart behavior.
