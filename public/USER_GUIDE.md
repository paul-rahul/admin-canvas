# Cloudflare-cerebro User Guide

Welcome to **Cloudflare-cerebro**, your comprehensive product feedback dashboard. This guide will help you navigate and utilize all features to effectively triage feedback, monitor product health, and make data-driven decisions.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Navigation & Layout](#navigation--layout)
3. [Overview Page](#overview-page)
4. [Business Metrics Page](#business-metrics-page)
5. [View Tickets Table](#view-tickets-table)
6. [Filtering & Searching](#filtering--searching)
7. [Advanced Features](#advanced-features)
8. [Key Interactions](#key-interactions)
9. [Use Cases & Scenarios](#use-cases--scenarios)
10. [Data Fields Reference](#data-fields-reference)
11. [Tips & Best Practices](#tips--best-practices)
12. [Troubleshooting & FAQ](#troubleshooting--faq)
13. [Performance Optimization](#performance-optimization)
14. [Accessibility](#accessibility)

---

## Getting Started

### What is Cloudflare-cerebro?

Cloudflare-cerebro is a product feedback dashboard designed to help product teams:
- **Triage** incoming feedback efficiently
- **Monitor** product health signals over time
- **Identify** emerging issues and trends
- **Prioritize** work based on data-driven insights

### Key Features

- **Overview Dashboard**: Real-time triage view with KPIs, trends, and active alerts
- **Business Metrics**: Longitudinal product health analysis with comparative views
- **View Tickets**: Comprehensive table with advanced filtering and sorting
- **AI-Powered Insights**: Automated analysis of feedback patterns
- **Needs Attention**: Active alerts for critical and high-priority issues
- **Interactive Charts**: Drag-to-select time ranges, zoom, and drill-down capabilities
- **Advanced Filtering**: Multi-dimensional filtering with URL synchronization
- **CSV Export**: Export filtered results for external analysis
- **Trend Analysis**: Detailed trend modals with issue-type breakdowns
- **Emerging Themes Detection**: Automatic identification of trending issues

### Getting Started Requirements

- **Access**: Use any modern web browser (Chrome, Firefox, Safari, or Edge)
- **Display**: Works best on desktop or laptop screens for full visibility of charts and tables
- **Internet**: Requires an active internet connection to view the latest feedback data
- **Setup**: No installation or special setup needed—simply access the dashboard URL

### First-Time Setup

1. **Open the Dashboard**: Access Cloudflare-cerebro through your organization's provided link
2. **Wait for Data**: The dashboard will automatically load your feedback data (you'll see a loading indicator)
3. **Start with Overview**: The Overview page gives you an immediate snapshot of your product's feedback health
4. **Check Urgent Items**: Click the bell icon (🔔) in the top right to see critical issues that need attention
5. **Explore Insights**: Click the AI Insights button (💡) to see automated recommendations and patterns

---

## Navigation & Layout

### Header Bar

The header bar appears at the top of every page and contains:

#### Left Section
- **Cloudflare-cerebro Logo**: Click to return to the Overview page
- **Navigation Links**:
  - **Overview**: Main triage dashboard
  - **Business Metrics**: Product health analytics

#### Right Section
- **Refresh Button** (🔄): Refreshes the database and reloads data
  - **Tooltip**: Hover to see "Click this button to refresh the database"
  - **Functionality**: Clicking this button reseeds the D1 database with fresh mock data and then reloads all feedback data
  - **Auto-Reseed**: The dashboard automatically checks if the database was last seeded more than 24 hours ago. If so, it automatically reseeds the database on page load to ensure data freshness
  - Shows last updated timestamp on hover
- **Insights Button** (💡): Opens AI-powered insights overlay
  - Shows emerging themes and patterns
  - Displays AI-generated recommendations powered by Cloudflare Workers AI
  - Insights are cached for 5 minutes using Cloudflare KV storage for fast retrieval
  - Shows cache status and AI availability indicators
- **Alerts Button** (🔔): Opens "Needs Attention" overlay
  - Shows count badge for active alerts
  - Displays critical and high-priority unresolved tickets
- **User Guide Button** (📘): Opens user guide documentation in a new tab
  - Features a fixed left sidebar with table of contents that stays visible while scrolling
  - Table of contents automatically highlights the current section
  - Click any TOC item to scroll to that section
  - Includes a "Scroll to Top" button for easy navigation
  - Blue background for easy identification

### Page Layout

All pages follow a consistent layout:
- **Header**: Fixed at top with navigation and actions
- **Content Area**: Scrollable main content
- **Dark Theme**: Glass-morphism design with dark background

---

## Overview Page

The Overview page (`/`) is your primary triage dashboard, providing a real-time view of product feedback.

### Default View

When you first load the Overview page, you'll see:
- **Time Filter**: Set to "Last 7 days" by default
- **Source Filter**: Set to "All sources" by default
- **KPI Cards**: Key metrics at a glance
- **Trends Chart**: Visual representation of ticket volume over time
- **View Tickets Table**: Filtered list of tickets

### KPI Strip

The KPI strip displays four key metrics:

1. **Total Tickets**
   - Count of all tickets matching current filters
   - Shows percentage change from previous period (if applicable)

2. **Critical Percentage**
   - Percentage of tickets marked as "Critical" urgency
   - Color-coded: Red for high percentages

3. **Top Source**
   - Most common feedback source (Discord, GitHub, Email, etc.)
   - Shows count and percentage

4. **Theme Distribution**
   - Visual breakdown of issue types with color-coded bar charts
   - Each issue type has a distinct color for easy identification:
     - Bug: Red
     - Feature: Blue
     - Performance: Orange
     - UX: Yellow-Green
     - Pricing: Green
     - Documentation: Grey
     - Account Access: Purple
     - Billing: Pink/Magenta
     - Reliability: Deep Orange
     - Integration: Teal
   - Shows percentage and count for each theme
   - Displays critical percentage for each theme
   - Click to filter by specific issue type

**Interaction**: Hover over any KPI card to see a tooltip with additional details.

### Trends Chart

The Trends chart shows ticket volume over time with three series:

- **Total Tickets**: All tickets (blue line)
- **Priority Tickets**: High + Critical urgency tickets (orange line)
- **Negative Tickets**: Tickets with negative sentiment (red line)

#### Chart Controls

- **Time Range Selector**: Choose from:
  - Last 24 hours
  - Last 7 days (default)
  - Last 30 days
  - All time
  - Custom range (date picker)

- **Legend Toggles**: Click legend items to show/hide series
  - Click "Total Tickets" to hide/show total line
  - Click "Priority Tickets" to hide/show priority line
  - Click "Negative Tickets" to hide/show negative line

- **Zoom**: Hover over chart to see exact values at specific dates

**Interaction**: Click on any data point to open a detailed trend modal showing:
- Issue type breakdown
- Source distribution
- Time-series data for the selected metric

#### Advanced Chart Interactions

##### Drag-to-Select Time Range

The Trends chart supports **drag-to-select** functionality for precise time range selection:

1. **Click and Hold**: Click anywhere on the chart
2. **Drag**: While holding, drag left or right to select a time range
3. **Release**: Release mouse button to finalize selection
4. **Visual Feedback**: Selected range is highlighted with a semi-transparent overlay
5. **Apply Selection**: Selected range can be used to filter the table or open detailed view

**Use Cases**:
- Select a specific incident period to analyze
- Compare two time periods side-by-side
- Focus on a spike or anomaly in the data

**Tips**:
- Start drag from left to right for chronological selection
- Drag from right to left to reverse the selection
- Click outside the chart to clear selection
- Selection persists until you click elsewhere

##### Chart Expansion

Click the **expand icon** (⛶) in the chart header to open a full-screen modal view:

**Expanded View Features**:
- **Larger Chart**: Better visibility for detailed analysis
- **Same Controls**: All filters and legend toggles available
- **Better Tooltips**: Easier to read exact values
- **More Data Points**: Better granularity for longer time ranges

**Interaction**:
- Click expand icon to open modal
- Click outside modal or X button to close
- All interactions work the same in expanded view

##### Zoom and Pan

While not directly implemented, you can achieve zoom-like behavior:
- **Use Time Range Selector**: Change from "7 days" to "1 day" for zoom
- **Use Custom Range**: Select narrow date range for focused view
- **Drag Selection**: Use drag-to-select for specific periods

### Filter Bar

Located below the KPI strip, the Filter Bar provides quick filtering that applies to the entire Overview page.

#### Filter Behavior

**Global Application**: Filters affect:
- KPI cards (recalculate based on filtered data)
- Trends chart (only shows data within filter range)
- View Tickets table (filters table results)
- Needs Attention overlay (only shows alerts within filter range)

**Filter Persistence**: 
- Filters persist in URL query parameters
- Page refresh maintains filter state
- Shareable links include filter state

**Filter Reset**:
- Navigate to different page resets filters
- Manual reset by selecting "All" for source and "All time" for time

#### Source Filter
- **Dropdown Menu**: Select one or multiple sources
  - Email
  - Support
  - Discord
  - GitHub
  - Twitter
  - Forum
  - Other
- **"All" Option**: Clear source filter

#### Time Filter
- **Quick Presets**:
  - Last 24 hours
  - Last 7 days (default)
  - Last 30 days
  - All time
- **Custom Range**: Click to open date picker
  - Select start and end dates
  - Use year scroll calendar for historical dates

**Interaction**: Filters update immediately and affect:
- KPI cards
- Trends chart
- View Tickets table

### View Tickets Table

See the [View Tickets Table](#view-tickets-table) section for detailed information.

### Needs Attention Overlay

Click the **bell icon** (🔔) in the header to open the "Needs Attention" overlay.

#### Active Alerts Tab
Shows unresolved tickets that need immediate attention:
- **Critical Tickets**: Red badge, sorted first
- **High Priority Tickets**: Orange badge
- **Time Window**: Last 7 days
- **Sorting**: Critical first, then by creation date (oldest first)

**Each Alert Shows**:
- Ticket title
- Severity badge (Critical/High)
- Reason for alert
- Time since creation
- Owner assignment
- Quick actions

**Interaction**:
- Click on any alert to open ticket detail modal
- Click outside overlay to close
- Alerts update automatically when data refreshes
- Click "View All Tickets" to see all matching tickets in table

#### Alert Details

Each alert shows comprehensive information:

**Visual Indicators**:
- **Severity Badge**: Color-coded (Critical = Red, High = Orange)
- **Time Indicator**: Relative time (e.g., "2 days ago")
- **Owner Badge**: Assigned team or "Unassigned"
- **Status Badge**: Current ticket status

**Alert Information**:
- **Title**: Full ticket title (truncated if long)
- **Reason**: Why this alert was triggered
- **Source**: Where feedback originated
- **Issue Type**: Category of the issue
- **Urgency**: Critical or High

**Quick Actions**:
- **Click Alert**: Opens full ticket detail modal
- **View Ticket**: Direct link to ticket in table
- **Owner Assignment**: See who should handle this

**Alert Sorting Logic**:
1. **Critical First**: All critical alerts appear before high-priority
2. **Oldest First**: Within each severity, oldest tickets first
3. **Limit**: Maximum 5 alerts shown (most urgent)

#### Emerging Issues Tab
Shows trending issues that are increasing in frequency:

**Layout**:
- **Position**: Left panel in the AI Insights overlay (35% of overlay width)
- **Card Design**: 2x2 grid layout showing four key categories
- **Card Categories**: Performance, Bug, UX, and Feature
- **Visual Design**: Each card has distinct colors, solid borders, and consistent height
- **Height**: Cards automatically adjust to fit content with maximum height constraints

**How Emerging Issues Are Identified**:
- Analyzes feedback from the last 14 days to ensure accurate comparison
- Compares feedback from the last 7 days to the previous 7 days (7-14 days ago)
- Highlights issues that are growing significantly in volume, urgency, or negative sentiment
- Shows you the growth rate and whether trends are improving or worsening
- Recommends which team should handle each issue based on the type of problem
- Uses advanced algorithms to detect statistically significant changes

**Display Information**:
- **Issue Type**: Category of the emerging issue (e.g., "Performance", "Bug", "UX", "Feature")
- **Count**: Number of tickets in this category from the last 7 days
- **Trend Indicator**: 
  - ⬆️ Up arrow = Increasing frequency
  - ⬇️ Down arrow = Decreasing frequency
- **Growth Rate**: Percentage change (e.g., "+25%", "-10%")
- **Owner**: Suggested team owner (Engineering, Product, Support, Design)
- **Visual Styling**: Each card has a distinct color scheme and solid 2px borders for clear separation
- **Recent Count**: Number of tickets in recent period
- **Previous Count**: Number of tickets in previous period (for comparison)

**Interaction**:
- **Click "View Tickets"**: Opens table filtered by that issue type
- **Click Issue Type Name**: Opens detailed trend modal with:
  - Time-series chart for that issue type
  - Source distribution
  - Urgency breakdown
  - Owner assignment
  - Drag-to-select time range capability

**Use Cases**:
- **Early Detection**: Catch issues before they become critical
- **Resource Planning**: Allocate team resources to trending issues
- **Proactive Response**: Address issues before customer impact
- **Pattern Recognition**: Identify recurring problems

**Example Scenario**:
If "Performance" issues show "+50%" growth:
1. Click "View Tickets" to see all performance tickets
2. Filter by urgency to find critical ones
3. Assign to Engineering team
4. Monitor trend to see if response is effective

#### AI Insights Tab
Displays AI-powered analysis of feedback patterns using Cloudflare Workers AI:

**Layout**:
- **2x2 Grid Format**: Four insights displayed in a grid layout for easy scanning
- **Emerging Issues Panel**: Shows on the left side with trending themes
- **AI Insights Panel**: Shows on the right side with AI-generated insights
- **Info Icon**: Hover over the info icon next to "AI Insights" title to learn how insights are generated

**Insight Types**:

1. **Critical Issues** (Warning - Orange/Yellow):
   - Count of unresolved critical tickets
   - Requires immediate attention
   - Actionable recommendations
   - **"View Tickets" Button**: Click to open filtered view showing all critical unresolved tickets from the last 7 days

2. **Trending Topics** (Info - Blue):
   - Most discussed themes in feedback
   - Issue types and sources with high volume
   - Patterns and correlations

3. **Feature Opportunities** (Success - Green):
   - Feature requests identified
   - Suggested improvements
   - Prioritization recommendations

4. **Additional Insight** (Primary - Custom Color):
   - Fourth insight varies based on current data patterns
   - May include resolution status, sentiment trends, or other key metrics

**Insight Structure**:
Each insight includes:
- **Title**: Concise summary
- **Content**: Detailed explanation with counts and context
- **Type**: Visual indicator (warning/info/success/primary) with distinct color coding
- **Actionability**: What to do with this insight
- **Interactive Elements**: Critical Issues insight includes "View Tickets" button

**How It Works**:
- **AI-Powered Analysis**: Uses Cloudflare Workers AI to analyze feedback data
- **Data Scope**: Analyzes only the last 7 days of feedback for focused, recent insights
- **Analysis Dimensions**: Examines ticket volumes, sentiment distributions, urgency patterns, customer segments, and recent negative feedback
- **Pattern Detection**: Identifies patterns and trends you might miss through manual review
- **Actionable Recommendations**: Provides specific, data-driven recommendations
- **Consistent Output**: Generates exactly 4 insights displayed in a 2x2 grid format
- **Smart Caching**: Insights are cached using Cloudflare KV storage for 5 minutes to ensure fast loading
  - Cache status is displayed in the info tooltip
  - Fresh insights are generated automatically when cache expires
  - "Generating insights..." message appears when new insights are being created

**Status Indicators**:
- **AI Generated** (Green badge): Insights successfully generated using Workers AI
- **Fallback Mode** (Yellow badge): Using default insights when AI is unavailable or encounters errors
- **AI Not Available** (Gray badge): AI binding not configured, using default insights
- **Cache Status**: Info tooltip shows cache age and refresh timing

**Always Available**:
Even if advanced AI analysis isn't available, you'll still see valuable insights based on:
- Critical issue counts
- Most common problem areas
- Feature request trends
- Overall product health indicators

**Interaction**:
- **Hover Info Icon**: Learn how insights are generated, view AI status, and check cache information
- **Click "View Tickets"**: On Critical Issues insight, opens a modal with filtered ticket view showing all critical unresolved tickets from the last 7 days
  - Modal uses the same FeedbackTable component as the Business Metrics page
  - Filters are pre-applied: Critical urgency, Unresolved/In Progress status, Last 7 days
- **Hover Insight Cards**: See additional context and details
- **Auto-Refresh**: Insights automatically refresh when the overlay is opened (if cache expired)
- **Cache Behavior**: Cached insights load instantly; expired cache triggers new generation

**Best Practices**:
- Review insights daily for new patterns
- Cross-reference with actual data
- Use insights to guide triage priorities
- Share insights in team meetings

---

## Business Metrics Page

The Business Metrics page (`/business-metrics`) provides longitudinal analysis of product health signals.

### Accessing Business Metrics

1. Click **"Business Metrics"** in the header navigation
2. Or navigate directly to `/business-metrics`

### Page Layout

The Business Metrics page is organized into sections:

1. **KPI Row**: Key performance indicators
2. **Trends Section**: Time-series visualizations
3. **Distribution Charts**: Breakdowns by category
4. **Lists & Tables**: Detailed breakdowns

### Time Range Selector

Located at the top of the page:

- **Preset Options**:
  - Last 7 days (default)
  - Last 30 days
  - Last 90 days
  - All time
  - Custom range

- **Compare Toggle**: Enable/disable comparison with previous period
  - When enabled, shows delta (change) indicators
  - Green up arrow: Increase
  - Red down arrow: Decrease
  - Gray dash: No change

**Interaction**: Changing time range updates all metrics and charts on the page.

### Source Filter

Filter all metrics by feedback source:
- **All Sources** (default)
- Individual sources (Email, Discord, GitHub, etc.)

**Interaction**: Source filter applies to all sections simultaneously.

### KPI Row

Displays four key metrics:

1. **Total Feedback**: Count of all tickets
2. **Critical Issues**: Count of critical urgency tickets
3. **Resolved**: Count of resolved tickets
4. **Average Response Time**: Average time to first action

**Each KPI Shows**:
- Current value
- Delta from previous period (if compare enabled)
- Percentage change
- Color-coded trend indicator

**Interaction**: Hover for detailed tooltip with breakdown.

### Trends Section

#### Negative Feedback Trends

Line chart showing negative feedback over time, segmented by customer segment:
- **Total**: All negative feedback
- **Enterprise**: Enterprise customers
- **Pro**: Pro plan customers
- **Free**: Free plan customers
- **Unknown**: Unsegmented customers

**Chart Controls**:
- **Legend Toggles**: Click to show/hide segments
- **Hover**: See exact values at specific dates
- **Time Range**: Updates based on page-level time range

**Interaction**: Click legend items to toggle visibility of each segment.

#### Theme Trends

Shows how different issue types trend over time:
- **Bug Reports**: Technical issues
- **Feature Requests**: New functionality requests
- **Performance Issues**: Speed/performance concerns
- **UX Issues**: User experience problems
- And more...

**Interaction**: Click on any theme to see detailed breakdown.

### Distribution Charts

#### Sentiment Distribution

Pie chart showing feedback sentiment:
- **Positive**: Green segment
- **Neutral**: Gray segment
- **Negative**: Red segment

**Interaction**: Hover segments to see exact counts and percentages.

#### Source Distribution

Bar chart showing feedback by source:
- Discord
- GitHub
- Email
- Support
- Twitter
- Forum
- Other

**Interaction**: Click bars to filter by source.

#### Category Distribution

Bar chart showing feedback by issue type:
- Performance
- Bug
- UX
- Feature
- Documentation
- And more...

**Interaction**: Click bars to filter by issue type.

### Detailed Lists

#### Fast Escalations

Shows issue types with rapid growth:
- **Issue Type**: Category name
- **Delta**: Change in count
- **Rate**: Percentage change
- **Trend**: Visual indicator

**Interaction**: Click "View Tickets" to see all tickets for that issue type.

#### Product Area Heatmap

Grid showing open tickets by product area and priority:
- **Rows**: Product areas (Workers, KV, R2, Pages, etc.)
- **Columns**: Priority bands (P0, P1, P2, P3)
- **Cells**: Count of tickets

**Color Coding**:
- Darker = More tickets
- Lighter = Fewer tickets

**Interaction**: Click cells to filter tickets by area and priority.

#### Backlog Aging

Shows how long unresolved tickets have been open:
- **0-3 days**: Recently created
- **4-7 days**: Week old
- **8-30 days**: Month old
- **31-90 days**: Quarter old
- **90+ days**: Very old

**Interaction**: Click buckets to filter by age.

### View Tickets Integration

Throughout the Business Metrics page, you'll find **"View Tickets"** buttons that:
1. Open the View Tickets table in a modal
2. Apply relevant filters automatically
3. Show only tickets matching the context

**Example**: Clicking "View Tickets" on a Fast Escalation item opens the table filtered to that issue type.

---

## View Tickets Table

The View Tickets table is the core component for browsing and managing feedback tickets.

### Accessing the Table

The table appears on:
- **Overview Page**: Below the Trends chart
- **Business Metrics Page**: Via "View Tickets" buttons (opens in modal)
- **Needs Attention Overlay**: Click alerts to see details

### Table Structure

#### Columns

1. **SOURCE**: Feedback source with icon
   - Email (envelope icon)
   - Support (headphones icon)
   - Discord (message icon)
   - GitHub (GitHub icon)
   - Twitter (Twitter icon)
   - Forum (users icon)

2. **DESCRIPTION**: Ticket title/description
   - Truncated with ellipsis if long
   - Click to open detail modal

3. **SENTIMENT**: Emotional tone
   - **Positive**: Green badge
   - **Neutral**: Gray badge
   - **Negative**: Red badge

4. **PRIORITY**: Priority band (P0-P3)
   - **P0**: Red badge (≥80 score)
   - **P1**: Orange badge (60-79 score)
   - **P2**: Blue badge (40-59 score)
   - **P3**: Gray badge (<40 score)

5. **URGENCY**: Urgency level
   - **Critical**: Red badge
   - **High**: Orange badge
   - **Medium**: Blue badge
   - **Low**: Gray badge

6. **USER TYPE**: Customer segment
   - **Enterprise**: Orange badge
   - **Pro**: Blue badge
   - **Free**: Green badge
   - **Unknown**: Gray badge

7. **ISSUE TYPE**: Category
   - Bug, Feature, Performance, UX, etc.
   - Color-coded by type

8. **OWNER**: Assigned team
   - Engineering
   - Product
   - Support
   - Design
   - Unassigned

9. **CREATED**: Creation date
   - Relative time (e.g., "2 days ago")
   - Hover to see exact timestamp

10. **UPDATED**: Last update date
    - Relative time
    - Hover to see exact timestamp

11. **STATUS**: Current status
    - **Unresolved**: Red badge
    - **In Progress**: Orange badge
    - **Resolved**: Green badge
    - **Ignored**: Gray badge

12. **LINK**: External references
    - JIRA link (if available)
    - External URL (if available)
    - Dash (-) if none

### Table Controls

#### Search Bar

Located above the table:
- **Placeholder**: "Search within filtered results"
- **Functionality**: Searches across:
  - Title
  - Description
  - Content
  - Tags
- **Real-time**: Updates results as you type
- **Clear**: Click X to clear search

#### Filter Chips

Active filters appear as chips above the table:
- **Color-coded**: Each filter type has a color
- **Remove**: Click X on chip to remove filter
- **Add Filter**: Click "+" button to open filter panel
- **Remove All**: Click "Remove All" to clear all filters

#### Filter Panel

Click the **filter icon** (🔽) or "+" button to open:

**Available Filters**:

1. **Sources**: Multi-select checkboxes
   - Email, Support, Discord, GitHub, Twitter, Forum, Other

2. **Sentiments**: Multi-select checkboxes
   - Positive, Neutral, Negative

3. **Urgencies**: Multi-select checkboxes
   - Critical, High, Medium, Low
   - **"High+" Toggle**: Include High and Critical only

4. **Issue Types**: Multi-select checkboxes
   - Bug, Feature, Performance, UX, Pricing, Documentation, etc.

5. **Priority Bands**: Multi-select checkboxes
   - P0, P1, P2, P3

6. **Owners**: Multi-select checkboxes
   - Engineering, Product, Support, Design, Unassigned

7. **Customer Segments**: Multi-select checkboxes
   - Enterprise, Pro, Free, Unknown

8. **Statuses**: Multi-select checkboxes
   - Unresolved, In Progress, Resolved, Ignored
   - **Default**: Unresolved + In Progress

9. **Tags**: Multi-select checkboxes
   - All available tags from tickets

10. **Time Range**: Radio buttons + date picker
    - Last 24 hours
    - Last 7 days
    - Last 30 days
    - All time
    - Custom range (date picker)

**Filter Logic**:
- **AND Logic**: Filters across categories are combined with AND
  - Example: If you select Source=Email and Status=Unresolved, tickets must match both
- **OR Logic**: Multiple selections within a category use OR
  - Example: If you select Source=Email and Source=Discord, tickets from either source will appear

**Interaction**:
- Select/deselect checkboxes to add/remove filters
- Filters apply immediately
- URL updates to reflect active filters (shareable links)

#### Sort Controls

Click the **sort icon** (⇅) to open sort menu:

**Sort Options**:
- **Creation Date** (default): Newest first
- **Update Date**: Most recently updated first
- **Priority**: Highest priority first
- **Urgency**: Critical → High → Medium → Low
- **Status**: Unresolved → In Progress → Resolved → Ignored

**Sort Direction**:
- Click again to reverse order
- Arrow indicator shows direction (↑ ascending, ↓ descending)

#### Pagination

Located at bottom of table:

- **Page Size**: Dropdown to select
  - 10 tickets per page
  - 50 tickets per page
  - 100 tickets per page

- **Navigation**:
  - **Previous**: Go to previous page
  - **Next**: Go to next page
  - **Page Numbers**: Click to jump to specific page
  - **Ellipsis**: Indicates more pages available

- **Info**: Shows "Showing X of Y tickets"

**Interaction**: Changing page size resets to page 1.

#### CSV Export

Click **"Download CSV"** button to export:
- Current filtered results
- All visible columns
- Formatted for Excel/Google Sheets

**Export Includes**:
- All ticket fields
- Formatted dates
- Status and priority labels

### Ticket Detail Modal

Click any ticket row or description to open detail modal.

#### Modal Sections

1. **Header**:
   - Ticket title
   - Status badge
   - Close button (X)

2. **Basic Information**:
   - **Source**: With icon
   - **Created**: Exact timestamp
   - **Updated**: Exact timestamp
   - **Status**: Current status (read-only)
   - **Owner**: Assigned team
   - **Priority**: Priority band
   - **Urgency**: Urgency level

3. **Content**:
   - **Description**: Full description text
   - **Content**: Detailed content (if available)

4. **Metadata**:
   - **Sentiment**: Positive/Neutral/Negative
   - **Issue Type**: Category
   - **Customer Segment**: Enterprise/Pro/Free/Unknown
   - **Tags**: All associated tags

5. **External Links**:
   - **JIRA**: Link to JIRA ticket (if available)
   - **External URL**: Related link (if available)
   - **Media**: Image/video link (if available)

6. **Resolution** (if resolved):
   - **Resolved At**: Resolution timestamp
   - **Resolved By**: Who resolved it
   - **Resolution Code**: Fixed/Workaround/Won't Fix/Duplicate/Cannot Reproduce
   - **Notes**: Resolution notes

**Interaction**:
- Click outside modal or X button to close
- Modal is read-only (no editing in this version)
- Links open in new tabs

---

## Filtering & Searching

### Filter Types

#### Global Filters (Overview Page)

Applied to entire page:
- **Source Filter**: Filter bar dropdown
- **Time Filter**: Filter bar presets or custom range

**Effect**: Updates KPIs, Trends chart, and View Tickets table.

#### Table Filters (View Tickets)

Applied only to table:
- All filter categories (Sources, Sentiments, Urgencies, etc.)
- Search bar
- Time range

**Effect**: Updates only the table view.

### Filter Combinations

#### Multiple Filters

Filters combine with AND logic:
- When you select filters from different categories, all must match
- Example: Source=Email AND Status=Unresolved AND Urgency=Critical
- All conditions must be true for a ticket to appear

#### Multiple Values in Category

Within a category, values combine with OR logic:
- When you select multiple values in the same category, any can match
- Example: Source=Email OR Discord OR GitHub
- Tickets matching any of these sources will appear

#### Search + Filters

Search applies to filtered results:
- First, filters are applied
- Then, search looks within those filtered results
- Example: (Source=Email AND Status=Unresolved) AND Search="performance"
- This finds Email tickets that are Unresolved and mention "performance"

### Sharing and Saving Views

Your filter settings are automatically saved in the web address:
- **Share with Team**: Copy the web address to share your exact filtered view with colleagues
- **Save for Later**: Bookmark the page to quickly return to your favorite filter combinations
- **Direct Links**: Send links that automatically apply your filters when opened

**How It Works**: When you apply filters, the web address updates automatically. Anyone who opens that address will see the same filtered view you created.

### Filter Persistence

- **Page Refresh**: Your filters are saved in the web address, so they stay when you refresh
- **Navigation**: Filters reset when you navigate to a different page
- **Clear All**: Use the "Remove All" button to clear all filters at once

### Search Functionality

#### What Gets Searched

- Ticket title
- Description
- Full content
- Tags

#### Search Behavior

- **Case Insensitive**: "BUG" matches "bug"
- **Partial Match**: "perf" matches "performance"
- **Real-time**: Updates as you type
- **Smart Search**: Waits for you to finish typing before searching

#### Search Tips

- Use specific terms: "rate limit" instead of "rate"
- Combine with filters for precise results
- Clear search to see all filtered results

---

## Data Management & Auto-Refresh

### Automatic Database Reseeding

Cloudflare-cerebro includes an automatic data freshness mechanism to ensure you're always working with relevant data:

**Auto-Reseed Logic**:
- **Check Frequency**: Every time the dashboard loads
- **Threshold**: If last seed was more than 24 hours ago
- **Action**: Automatically reseeds the database with fresh mock data
- **Storage**: Last seed timestamp stored in Cloudflare KV cache
- **Transparency**: Reseed happens in background; you'll see loading indicators

**Why Auto-Reseed?**:
- Ensures data includes recent tickets (last 7 days, last 24 hours)
- Maintains realistic date distributions
- Keeps ticket status distributions current
- Provides fresh data for accurate insights

**Manual Reseed**:
- Click the **Refresh Button** (🔄) in the header
- Tooltip shows: "Click this button to refresh the database"
- Immediately triggers reseed and data reload
- Useful when you need fresh data on demand

**Reseed Process**:
1. Generates fresh mock data with current date ranges
2. Clears existing database entries
3. Inserts new entries in batches (respects rate limits)
4. Stores seed timestamp in KV cache
5. Reloads all feedback data in the UI
6. Updates all charts, KPIs, and tables

**Data Freshness Indicators**:
- Last updated timestamp shown on refresh button hover
- Loading indicators during reseed process
- Automatic refresh of all dashboard components after reseed

### AI Insights Caching

**Cache Strategy**:
- **Storage**: Cloudflare KV (Key-Value) storage
- **TTL**: 1 hour (3600 seconds)
- **Scope**: Only AI-generated insights are cached (not fallback insights)
- **Refresh**: Automatically generates new insights when cache expires

**Cache Behavior**:
- **Cache Hit**: Instant loading of insights (no API call)
- **Cache Miss**: Generates new insights using Workers AI
- **Cache Expired**: Automatically refreshes on overlay open
- **Status Display**: Cache age shown in info tooltip

**Benefits**:
- Fast loading times for frequently accessed insights
- Reduced API calls and costs
- Better user experience with instant results
- Automatic refresh ensures insights stay current

---

## Advanced Features

### Issue Trend Modal

The Issue Trend Modal provides deep-dive analysis for specific issue types or metrics.

#### Opening the Modal

**From Overview Page**:
- Click any data point on the Trends chart
- Click on an issue type in the Theme Distribution card
- Click "View Details" on any KPI card (if available)

**From Business Metrics**:
- Click on any theme in Theme Trends section
- Click "View Trend" on Fast Escalations items
- Click on distribution chart segments

#### Modal Features

**Time Range Selector**:
- **1 day**: Hourly buckets for recent analysis
- **7 days**: 6-hour buckets for weekly view
- **1 month**: Daily buckets for monthly trends
- **3 months**: Weekly buckets for quarterly analysis
- **6 months**: Bi-weekly buckets for semi-annual view
- **1 year**: Monthly buckets for annual trends

**Chart Visualization**:
- **Line Chart**: Shows ticket count over time
- **Average Urgency**: Color-coded by urgency level
- **Interactive Tooltips**: Hover for exact values
- **Drag Selection**: Select time ranges by dragging

**Source Filter**:
- Filter trend data by feedback source
- Compare sources side-by-side
- Identify source-specific patterns

**Summary Statistics**:
- Total tickets in selected range
- Average urgency score
- Peak periods identified
- Growth trends

**Export Capabilities**:
- Copy selected time range
- Apply range to main table filter
- Share trend view via URL

#### Drag-to-Select Time Range

**How It Works**:
1. Click and hold anywhere on the chart
2. Drag left or right to select time range
3. Visual overlay shows selected range
4. Release to finalize selection
5. Selected range can be applied to filters

**Use Cases**:
- **Incident Analysis**: Select incident period to analyze impact
- **Comparison**: Select two periods to compare
- **Spike Investigation**: Focus on anomaly periods
- **Custom Reporting**: Select specific date ranges

**Tips**:
- Start from left edge for earliest date
- Drag right for later dates
- Click outside chart to clear selection
- Selection persists until cleared

### Sharing and Bookmarking Views

All your filter settings are automatically saved in the web address, making it easy to:

#### Share Filtered Views with Your Team

**How It Works**:
- Every time you change filters, the web address updates automatically
- Simply copy the address from your browser's address bar
- Share it with team members—they'll see exactly the same filtered view
- Works on any device or browser

**Common Use Cases**:
- Share a view of all critical issues from the last week
- Send a filtered view of Enterprise customer feedback
- Bookmark your daily triage view for quick access
- Create standard views for weekly team meetings

**Tips for Sharing**:
- Name your bookmarks descriptively (e.g., "Critical Issues - Last 7 Days")
- Share filtered views in team channels or email
- Create standard views that everyone uses
- Update bookmarks when your workflow changes

#### Creating and Using Bookmarks

**To Save a View**:
1. Apply the filters you want to save
2. Copy the web address from your browser's address bar
3. Save it as a browser bookmark
4. Give it a clear name like "Critical Issues - Last 7 Days" or "Weekly Review View"

**Using Your Saved Views**:
- Click your bookmark to instantly restore that filtered view
- All your filters will be automatically applied
- The table and charts will show exactly what you saved

**Best Practices**:
- Create bookmarks for views you use regularly
- Share bookmark links with your team for consistency
- Update bookmarks when your workflow changes
- Organize bookmarks by purpose (daily triage, weekly review, etc.)

### Advanced Filter Combinations

#### Complex Filter Logic

**AND Logic Across Categories**:
- When you select filters from different categories, all must match
- Example: Source=Email AND Status=Unresolved AND Urgency=Critical
- All conditions must be true for a ticket to appear

**OR Logic Within Categories**:
- When you select multiple values in the same category, any can match
- Example: Source=Email OR Discord OR GitHub
- Tickets matching any of these sources will appear

**Combined Example**:
- You can combine both AND and OR logic
- Example: (Source=Email OR Discord) AND (Status=Unresolved OR In Progress) AND Urgency=Critical
- This finds tickets from Email or Discord that are Unresolved or In Progress and are Critical

#### Filter Precedence

1. **Global Filters** (Overview page): Applied first
2. **Table Filters**: Applied to already-filtered data
3. **Search**: Applied last to filtered results

**Example Flow**:
1. Global: Source=Email, Time=7d
2. Table: Status=Unresolved, Urgency=Critical
3. Search: "performance"
4. Result: Email tickets from last 7 days that are unresolved, critical, and mention "performance"

#### Filter Persistence

**What Gets Saved**:
- Your filter settings in the web address (shareable with others)
- Current session (until you close the browser)
- Page refresh (your filters stay when you refresh)

**What Doesn't Get Saved**:
- Navigating to a different page (filters reset)
- Closing your browser (unless you bookmarked the page)
- Using incognito/private browsing (only saved for that session)

### CSV Export Advanced Usage

#### Export Options

**What Gets Exported**:
- All visible columns
- All filtered rows (respects filters)
- Formatted dates and times
- Status and priority labels
- All ticket metadata

**Export Format**:
- **File Name**: Files are named with date and time (e.g., cerebro-export-2026-01-20-143022.csv)
- **Encoding**: UTF-8 (supports all characters)
- **Delimiter**: Comma-separated values
- **Headers**: First row contains column names

#### Export Best Practices

**Before Exporting**:
1. Apply desired filters
2. Verify row count matches expectations
3. Check time range is appropriate
4. Ensure all needed columns are visible

**After Exporting**:
1. Open in Excel or Google Sheets
2. Verify data integrity
3. Format dates if needed
4. Create pivot tables for analysis

**Use Cases**:
- **Reporting**: Export for stakeholder reports
- **Analysis**: Import into analysis tools
- **Backup**: Archive filtered views
- **Sharing**: Share data with external teams

### Chart Interaction Patterns

#### Multi-Chart Analysis

**Comparing Charts**:
- Use same time range across charts
- Apply same source filter
- Compare trends side-by-side
- Identify correlations

**Example Workflow**:
1. Set time range to "Last 30 days"
2. View Trends chart (total tickets)
3. View Negative Feedback Trends (sentiment)
4. Compare patterns
5. Identify if negative feedback correlates with total volume

#### Chart Drill-Down

**From Overview to Detail**:
1. Click data point on Trends chart
2. Opens Issue Trend Modal
3. See breakdown by issue type
4. Filter by source
5. Select time range
6. Apply to table if needed

**From Business Metrics**:
1. Click theme in Theme Trends
2. See detailed trend for that theme
3. Compare with other themes
4. Export or share view

### Custom Date Range Selection

#### Year Scroll Calendar

**Accessing**:
- Click "Custom" in time filter
- Opens Year Scroll Calendar
- Navigate by year and month

**Features**:
- **Year Navigation**: Scroll through years
- **Month Selection**: Click month to see days
- **Day Selection**: Click start and end dates
- **Visual Feedback**: Selected range highlighted
- **Quick Presets**: Common ranges available

**Use Cases**:
- **Quarterly Reviews**: Select Q1, Q2, Q3, Q4
- **Sprint Analysis**: Select sprint dates
- **Incident Periods**: Select incident timeframe
- **Historical Comparison**: Compare same period year-over-year

**Tips**:
- Use year scroll for historical dates
- Click month to expand day view
- Selected dates show in different color
- Range validation prevents invalid selections

---

## Key Interactions

### Click Interactions

#### Overview Page

1. **KPI Cards**:
   - **Hover**: Show tooltip with details
   - **Click Theme Distribution**: Filter by issue type

2. **Trends Chart**:
   - **Hover**: Show exact values
   - **Click Data Point**: Open trend detail modal
   - **Click Legend**: Toggle series visibility

3. **Filter Bar**:
   - **Click Source Dropdown**: Open source menu
   - **Click Time Preset**: Apply time filter
   - **Click Custom**: Open date picker

4. **View Tickets Table**:
   - **Click Row**: Open ticket detail modal
   - **Click Description**: Open ticket detail modal
   - **Click Filter Icon**: Open filter panel
   - **Click Sort Icon**: Open sort menu
   - **Click CSV Button**: Download export

#### Business Metrics Page

1. **KPI Cards**:
   - **Hover**: Show detailed breakdown
   - **Click**: (No action currently)

2. **Charts**:
   - **Hover**: Show exact values
   - **Click Legend**: Toggle series visibility
   - **Click Bars/Points**: Filter by that category

3. **View Tickets Buttons**:
   - **Click**: Open table modal with filters applied

4. **Fast Escalations**:
   - **Click Issue Type**: See trend detail
   - **Click View Tickets**: Filter table

5. **Product Area Heatmap**:
   - **Click Cell**: Filter by area and priority

6. **Backlog Aging**:
   - **Click Bucket**: Filter by age range

#### Header

1. **Cloudflare-cerebro Logo**: Navigate to Overview
2. **Overview Link**: Navigate to Overview
3. **Business Metrics Link**: Navigate to Business Metrics
4. **Refresh Button**: Reseed database and reload all data
   - Hover to see tooltip: "Click this button to refresh the database"
   - Clicking triggers database reseed with fresh mock data
   - After reseed completes, all feedback data is automatically reloaded
   - Last seed timestamp is stored in cache for auto-reseed checks
5. **Insights Button**: Open AI-powered insights overlay
   - Shows AI-generated insights using Cloudflare Workers AI
   - Displays cache status and AI availability
   - Automatically refreshes if cache expired
6. **Alerts Button**: Open needs attention overlay
   - Shows count badge for active alerts
   - Displays critical and high-priority unresolved tickets
7. **User Guide Button**: Open comprehensive user guide in new tab
   - Fixed left sidebar with table of contents
   - Auto-highlighting of current section
   - Click-to-scroll navigation
   - Scroll-to-top button

### Keyboard Interactions

#### Search Bar
- **Type**: Start searching
- **Escape**: Clear search
- **Enter**: (No special action)

#### Filter Panel
- **Escape**: Close panel
- **Tab**: Navigate between filters
- **Space**: Toggle checkbox

#### Table
- **Arrow Keys**: (Not implemented)
- **Enter**: Open selected ticket (if implemented)

#### Modals
- **Escape**: Close modal
- **Tab**: Navigate between elements

### Hover Interactions

#### Tooltips
Many elements show tooltips on hover:
- **KPI Cards**: Detailed metrics
- **Chart Data Points**: Exact values
- **Dates**: Full timestamp
- **Badges**: Additional context

#### Visual Feedback
- **Buttons**: Highlight on hover
- **Links**: Underline on hover
- **Table Rows**: Background color change
- **Filter Chips**: Show remove option

### Drag & Drop

Not currently supported.

### Multi-Select

#### Filter Panel
- **Checkboxes**: Select multiple values
- **Select All**: (Not implemented)
- **Clear Selection**: Uncheck individually

#### Table
- **Row Selection**: (Not implemented)
- **Bulk Actions**: (Not implemented)

---

## Use Cases & Scenarios

### Daily Triage Workflow

**Scenario**: Product manager starts each day reviewing new feedback.

**Steps**:
1. **Open Overview Page**: Default view shows last 7 days
2. **Check Alerts**: Click bell icon, review critical/high items
3. **Review KPIs**: Check Total Tickets and Critical Percentage
4. **Examine Trends**: Look for spikes or anomalies in chart
5. **Filter by Source**: Focus on Support and Email first
6. **Sort Table**: Sort by Priority or Urgency
7. **Address Critical**: Open and review critical tickets
8. **Assign Owners**: Note which tickets need assignment
9. **Check Insights**: Review AI insights for patterns
10. **Export**: Export filtered view for team sync

**Time**: 15-30 minutes daily

### Weekly Product Health Review

**Scenario**: Weekly team meeting to review product health.

**Steps**:
1. **Navigate to Business Metrics**: Click "Business Metrics" in header
2. **Set Time Range**: Select "Last 7 days"
3. **Enable Compare**: Toggle compare to see vs. previous week
4. **Review KPIs**: Check Total Feedback, Critical Issues, Resolved count
5. **Analyze Trends**: Review Negative Feedback Trends by segment
6. **Check Fast Escalations**: Identify rapidly growing issues
7. **Review Backlog Aging**: Check for stale tickets
8. **Export Data**: Export metrics for presentation
9. **Create Action Items**: Based on findings
10. **Share Insights**: Share URL with team

**Deliverables**:
- Weekly metrics summary
- Trend analysis
- Action items
- Team assignments

### Incident Response

**Scenario**: Responding to a product incident reported via feedback.

**Steps**:
1. **Identify Incident Period**: Note when reports started
2. **Filter by Time**: Set custom range to incident period
3. **Search Keywords**: Search for incident-related terms
4. **Filter by Urgency**: Focus on Critical and High
5. **Review Trends**: Check Trends chart for spike
6. **Analyze Sources**: See which channels reported issue
7. **Group by Issue Type**: Identify root cause category
8. **Export Affected Tickets**: Export for incident report
9. **Track Resolution**: Monitor as tickets get resolved
10. **Post-Mortem**: Use data for incident analysis

**Key Metrics**:
- Number of affected tickets
- Time to first report
- Resolution time
- Customer segments affected

### Feature Launch Monitoring

**Scenario**: Monitoring feedback after a new feature launch.

**Steps**:
1. **Set Custom Date Range**: Select launch date to today
2. **Filter by Tags**: Filter by feature-specific tags
3. **Search Feature Name**: Search for feature mentions
4. **Review Sentiment**: Check sentiment distribution
5. **Analyze Issue Types**: See if bugs, UX issues, or feature requests
6. **Monitor Trends**: Watch Trends chart for volume changes
7. **Check Urgency**: Identify critical issues quickly
8. **Segment Analysis**: Compare Enterprise vs. Pro vs. Free
9. **Export Feedback**: Export for product team review
10. **Create Follow-ups**: Identify tickets needing response

**Success Metrics**:
- Positive sentiment percentage
- Low critical issue count
- Feature request volume
- User segment adoption

### Customer Segment Analysis

**Scenario**: Understanding feedback patterns by customer segment.

**Steps**:
1. **Navigate to Business Metrics**: Go to Business Metrics page
2. **Filter by Segment**: Use segment filter (if available)
3. **Review Negative Trends**: Check Negative Feedback Trends chart
4. **Compare Segments**: Toggle segments in legend
5. **Analyze Issue Types**: See segment-specific issues
6. **Check Priority Distribution**: Compare priority bands
7. **Review Resolution Rates**: Check resolved vs. unresolved
8. **Export Segment Data**: Export for analysis
9. **Identify Patterns**: Find segment-specific trends
10. **Create Action Plan**: Address segment-specific needs

**Insights**:
- Which segments have most issues
- What types of issues per segment
- Resolution rates by segment
- Priority distribution

### Quarterly Business Review

**Scenario**: Preparing quarterly business review presentation.

**Steps**:
1. **Set Time Range**: Select "Last 90 days" or custom quarter range
2. **Enable Compare**: Compare with previous quarter
3. **Review All KPIs**: Document key metrics
4. **Analyze Trends**: Capture trend charts
5. **Review Distributions**: Document sentiment, source, issue type distributions
6. **Check Fast Escalations**: Identify major issues
7. **Review Backlog**: Analyze aging and resolution rates
8. **Export Multiple Views**: Export different filtered views
9. **Create Summary**: Compile key findings
10. **Prepare Presentation**: Use exported data for slides

**Key Metrics**:
- Total feedback volume
- Critical issue trends
- Resolution rates
- Customer satisfaction indicators
- Emerging issues

### Sprint Planning Preparation

**Scenario**: Using feedback to inform sprint planning.

**Steps**:
1. **Set Time Range**: Last sprint period or "Last 14 days"
2. **Filter Unresolved**: Show only unresolved and in-progress
3. **Sort by Priority**: Highest priority first
4. **Group by Owner**: See team workload
5. **Filter by Issue Type**: Focus on planned work areas
6. **Review Emerging Issues**: Check Needs Attention overlay
7. **Export Backlog**: Export for sprint planning tool
8. **Identify Dependencies**: Review related tickets
9. **Estimate Effort**: Use priority and urgency as guide
10. **Create Sprint Backlog**: Select tickets for sprint

**Deliverables**:
- Prioritized ticket list
- Team assignments
- Effort estimates
- Dependencies identified

---

## Understanding Ticket Information

### What Information Each Ticket Contains

#### Basic Ticket Details

**Ticket ID**:
- A unique identifier for each piece of feedback
- Used internally to track and reference tickets
- Visible in exports and when sharing specific tickets

**Title**:
- A brief summary of the feedback or issue
- Shown in the table view (may be shortened if very long)
- Click to see the full title in the detail view

**Description**:
- A short explanation of the issue or feedback
- Shown in the table (may be shortened)
- Full description available when you open the ticket details

**Full Content**:
- The complete, detailed feedback from the customer
- Available when you click to view ticket details
- Includes all context and information provided by the customer

#### How Tickets Are Categorized

**Source**:
- Where the feedback came from
- Available values:
  - Email
  - Support
  - Discord
  - GitHub
  - Twitter
  - Forum
  - Other
- Each source has a distinct icon for easy identification
- Use this to understand which channels generate the most feedback

**Issue Type**:
- The category of feedback
- Available values:
  - Bug
  - Feature Request
  - Performance Issue
  - UX Problem
  - Pricing Question
  - Documentation Need
  - Account Access
  - Billing
  - Reliability
  - Integration
- Each type is color-coded for quick visual identification
- Helps you route issues to the right team

**Sentiment**:
- The emotional tone of the feedback
- Available values:
  - Positive (green)
  - Neutral (gray)
  - Negative (red)
- Helps you understand customer satisfaction
- Useful for tracking how sentiment changes over time

**Urgency**:
- How urgent the issue is
- Available values:
  - Critical (red)
  - High (orange)
  - Medium (blue)
  - Low (gray)
- Critical issues need immediate attention
- Use this to prioritize your daily work

**Priority Score**:
- A calculated score from 0-100 that considers multiple factors
- Factors include urgency, sentiment, customer segment, how recent it is, and current status
- Higher scores mean higher priority

**Priority Band**:
- Simplified priority grouping
- Available bands:
  - P0 (80-100): Critical, immediate action needed
  - P1 (60-79): High priority, urgent
  - P2 (40-59): Medium priority
  - P3 (0-39): Lower priority

#### Ownership and Customer Information

**Owner**:
- Which team is responsible
- Available values:
  - Engineering
  - Product
  - Support
  - Design
  - Unassigned
- Helps you see team workload and route issues correctly
- Some tickets are automatically assigned based on issue type:
  - Performance/Bug/Reliability issues → Engineering
  - UX/Feature/Documentation → Product
  - Account Access/Billing → Support

**Customer Segment**:
- The customer tier
- Available values:
  - Enterprise (orange)
  - Pro (blue)
  - Free (green)
  - Unknown (gray)
- Helps prioritize based on customer value
- Enterprise customers typically get highest priority

#### Status and Resolution Tracking

**Status**:
- Current state of the ticket
- Available values:
  - Unresolved (red)
  - In Progress (orange)
  - Resolved (green)
  - Ignored (gray)
- Shows where each ticket is in your workflow
- Use this to track progress and identify bottlenecks

**Resolution Information** (when resolved):
- When it was resolved
- Who resolved it (person or team)
- How it was resolved
- Available resolution types:
  - Fixed
  - Workaround Provided
  - Won't Fix
  - Duplicate
  - Cannot Reproduce
- Any notes about the resolution
- Helps you track resolution quality and learn from past issues

#### Dates and Timing

**Created Date**:
- When the customer first submitted the feedback
- Shown as relative time ("2 days ago") or exact date/time
- Used for sorting, filtering, and understanding how old issues are

**Last Updated**:
- When the ticket was last modified
- Helps identify stale tickets that haven't been touched
- Useful for tracking response times

#### External Links and References

**JIRA Links**:
- If the ticket is tracked in JIRA, you'll see a JIRA ticket number (e.g., CB-1234)
- Click to open the ticket in your JIRA system
- Helps connect feedback to your project management workflow

**External Links**:
- Links to related resources, documentation, or external systems
- May include links to GitHub issues, support tickets, or other tracking systems

**Media Attachments**:
- Links to images, videos, or screenshots provided by customers
- Helps you see visual evidence of issues
- Opens in a new window when clicked

#### Additional Information

**Tags**:
- Flexible labels for categorizing tickets (e.g., "feature", "bug", "performance", "api", "dashboard")
- Use tags to group related issues or track specific themes
- Searchable and filterable

**Author**:
- The person who submitted the feedback
- Helps you identify repeat reporters or follow up with specific customers

### How Metrics Are Calculated

**Ticket Age**:
- Shows how many days old a ticket is
- Helps identify stale tickets that need attention
- Used for backlog aging analysis

**Response Time**:
- Time from when ticket was created to first action
- Helps track how quickly your team responds to customers
- Useful for SLA monitoring and performance metrics

**Resolution Time**:
- Total time from creation to resolution
- Helps measure how efficiently issues are resolved
- Important metric for customer satisfaction

### How Priority and Assignment Work

**Priority Score**:
- Automatically calculated based on urgency, sentiment, customer segment, how recent it is, and current status
- Higher scores = higher priority
- Helps ensure critical issues don't get missed

**Automatic Team Assignment**:
- Performance/Bug/Reliability issues → Engineering team
- UX/Feature/Documentation → Product team
- Account Access/Billing → Support team
- Others → Unassigned (needs manual assignment)

**Ticket Lifecycle**:
- Tickets start as Unresolved
- Move to In Progress when work begins
- End as either Resolved or Ignored
- Once resolved or ignored, tickets don't typically reopen

---

## Tips & Best Practices

### Efficient Triage Workflow

1. **Start with Overview**:
   - Check KPI cards for quick health check
   - Review Trends chart for patterns
   - Check Needs Attention overlay for urgent items

2. **Use Default Filters**:
   - Default shows "Last 7 days" and "Unresolved + In Progress"
   - Adjust time range based on your workflow

3. **Filter by Source**:
   - Focus on high-priority sources first (e.g., Support, Email)
   - Use source filter to triage by channel

4. **Sort by Priority**:
   - Sort table by Priority or Urgency
   - Address Critical items first

5. **Use Search for Specific Issues**:
   - Search for known issues or keywords
   - Combine with filters for precision

### Monitoring Product Health

1. **Regular Business Metrics Review**:
   - Check weekly trends
   - Compare periods using compare toggle
   - Watch for fast escalations

2. **Track Sentiment**:
   - Monitor negative sentiment trends
   - Segment by customer type
   - Identify improvement opportunities

3. **Watch Emerging Issues**:
   - Check Needs Attention overlay regularly
   - Review emerging themes
   - Act on trends before they escalate

4. **Analyze by Customer Segment**:
   - Filter by Enterprise/Pro/Free
   - Prioritize based on customer value
   - Track segment-specific issues

### Filtering Strategies

1. **Start Broad, Then Narrow**:
   - Begin with default filters
   - Add specific filters as needed
   - Use search for final refinement

2. **Save Common Filters**:
   - Bookmark frequently used filter combinations
   - Share URLs with team members
   - Create standard views

3. **Combine Filters Effectively**:
   - Use AND logic across categories
   - Use OR logic within categories
   - Test filter combinations

4. **Time Range Selection**:
   - Use "Last 7 days" for daily triage
   - Use "Last 30 days" for weekly reviews
   - Use custom ranges for specific analysis

### Using AI Insights

1. **Review Regularly**:
   - Check insights overlay weekly
   - Look for patterns and trends
   - Act on recommendations

2. **Validate Insights**:
   - Cross-reference with actual data
   - Use View Tickets to verify
   - Combine with manual analysis

3. **Share Insights**:
   - Use insights in team meetings
   - Reference in product planning
   - Track action items

### Performance Optimization

1. **Use Appropriate Page Sizes**:
   - 10 rows for quick browsing
   - 50 rows for detailed review
   - 100 rows for bulk analysis

2. **Limit Time Ranges**:
   - Shorter ranges load faster
   - Use "All time" sparingly
   - Custom ranges for specific needs

3. **Filter Before Searching**:
   - Apply filters first
   - Then use search
   - Reduces search scope

### Collaboration Tips

1. **Share Filtered Views**:
   - Copy URL with filters
   - Share in team channels
   - Bookmark common views

2. **Use CSV Exports**:
   - Export filtered results
   - Share with stakeholders
   - Use for reporting

3. **Document Findings**:
   - Use ticket detail modal for context
   - Reference JIRA links
   - Track resolution notes

### Troubleshooting

#### Data Not Updating
- Click refresh button
- Check last updated timestamp
- Verify filters aren't hiding data

#### Filters Not Working
- Clear all filters and reapply
- Check URL for filter parameters
- Verify filter combinations

#### Table Empty
- Check active filters
- Verify time range includes data
- Clear search if active

#### Charts Not Showing
- Verify time range has data
- Check source filter
- Ensure compare toggle is appropriate

---

## Troubleshooting & FAQ

### Common Issues

#### Data Not Loading

**Symptoms**:
- Page shows loading spinner indefinitely
- Empty tables or charts
- Error messages in console

**Solutions**:
1. **Check Internet Connection**: Ensure stable connection
2. **Refresh Page**: Click refresh button or F5
3. **Clear Browser Cache**: Clear cache and reload
4. **Check Console**: Look for error messages
5. **Try Different Browser**: Rule out browser-specific issues
6. **Check Deployment**: Verify deployment is live

**Prevention**:
- Keep browser updated
- Clear cache regularly
- Use stable internet connection

#### Filters Not Working

**Symptoms**:
- Filters don't apply
- Results don't change
- Filters reset unexpectedly

**Solutions**:
1. **Clear All Filters**: Click "Remove All"
2. **Reapply Filters**: Apply one at a time
3. **Check URL**: Verify filters in URL parameters
4. **Refresh Page**: Reload to reset state
5. **Check Filter Logic**: Verify AND/OR logic is correct

**Common Causes**:
- Conflicting filters
- URL parameter corruption
- Browser cache issues
- JavaScript errors

#### Charts Not Displaying

**Symptoms**:
- Empty chart areas
- Missing data points
- Charts don't update

**Solutions**:
1. **Check Time Range**: Ensure range has data
2. **Check Filters**: Verify filters aren't excluding all data
3. **Refresh Data**: Click refresh button
4. **Check Browser Console**: Look for chart errors
5. **Try Different Time Range**: Test with "All time"

**Prevention**:
- Use appropriate time ranges
- Don't over-filter data
- Keep browser updated

#### Search Not Finding Results

**Symptoms**:
- Search returns no results
- Expected tickets not found
- Search seems broken

**Solutions**:
1. **Check Spelling**: Verify search terms
2. **Clear Search**: Remove search and reapply
3. **Check Filters**: Ensure filters aren't excluding results
4. **Try Partial Match**: Use shorter search terms
5. **Check Case**: Search is case-insensitive, but verify terms

**Search Tips**:
- Use specific terms
- Try partial words
- Combine with filters
- Check multiple fields

#### CSV Export Issues

**Symptoms**:
- Export fails
- Missing data in export
- Wrong format

**Solutions**:
1. **Check Filters**: Verify filters are correct
2. **Reduce Data**: Export smaller subsets
3. **Try Different Browser**: Some browsers handle CSV differently
4. **Check File**: Open in text editor to verify format
5. **Re-export**: Try exporting again

**Export Tips**:
- Export filtered views
- Check row count matches
- Verify all columns included
- Use UTF-8 encoding

#### Performance Issues

**Symptoms**:
- Slow page loading
- Laggy interactions
- Browser freezing

**Solutions**:
1. **Reduce Data**: Use shorter time ranges
2. **Limit Filters**: Don't apply too many filters
3. **Smaller Page Size**: Use 10 or 50 rows instead of 100
4. **Close Other Tabs**: Free up browser resources
5. **Update Browser**: Use latest browser version
6. **Clear Cache**: Clear browser cache and cookies

**Optimization Tips**:
- Use appropriate time ranges
- Limit concurrent filters
- Use pagination effectively
- Close unused tabs

### Frequently Asked Questions

#### General Questions

**Q: How often is data updated?**
A: Data refreshes on page load and when you click the refresh button. Real-time updates are not currently available.

**Q: Can I edit tickets?**
A: No, tickets are read-only in the current version. Editing capabilities may be added in future versions.

**Q: How do I add new tickets?**
A: Tickets are created through external systems (Support, Discord, GitHub, etc.) and automatically appear in Cloudflare-cerebro.

**Q: Can I customize the dashboard?**
A: Limited customization is available through filters and views. Full customization is not currently supported.

**Q: Is there a mobile app?**
A: No mobile app is available. The dashboard is accessible via mobile browsers with responsive design.

#### Filtering Questions

**Q: How many filters can I apply at once?**
A: There's no hard limit, but performance may degrade with many filters. Typically 5-10 filters work well.

**Q: Can I save filter combinations?**
A: Yes, bookmark URLs with filter parameters or copy URLs to save filter combinations.

**Q: Do filters persist across sessions?**
A: Filters persist in URL, so they persist if you bookmark or share the URL. Otherwise, they reset on navigation.

**Q: Can I filter by multiple values in one category?**
A: Yes, multiple selections within a category use OR logic (e.g., Source=Email OR Discord).

**Q: How do I clear all filters?**
A: Click "Remove All" button in the filter bar, or manually remove each filter chip.

#### Data Questions

**Q: How far back does data go?**
A: Data spans from 2012 to present (approximately 14 years of historical data).

**Q: Can I export all data?**
A: Yes, remove all filters and export. Note: Large exports may take time and have performance implications.

**Q: Is data real or mock?**
A: Current implementation uses mock data for demonstration. In production, this would connect to real feedback systems.

**Q: How is priority score calculated?**
A: Priority score (0-100) considers urgency, sentiment, status, customer segment, recency, and owner assignment.

**Q: What determines ticket ownership?**
A: Ownership can be manually assigned or auto-assigned based on issue type (Engineering for bugs, Product for features, etc.).

#### Chart Questions

**Q: Can I zoom into charts?**
A: Use time range selector to "zoom" or use drag-to-select for specific ranges. Direct zoom is not available.

**Q: How do I compare two time periods?**
A: On Business Metrics page, enable "Compare" toggle to see deltas vs. previous period.

**Q: Can I export charts?**
A: Charts can be exported via screenshot. Data export is available via CSV export.

**Q: Why don't all data points show?**
A: Charts aggregate data into buckets based on time range. Longer ranges use larger buckets.

**Q: Can I customize chart colors?**
A: Chart colors are fixed and follow the design system. Each theme/issue type has a distinct color for easy identification:
- Bug: Red
- Feature: Blue
- Performance: Orange
- UX: Yellow-Green
- Pricing: Green
- Documentation: Grey
- Account Access: Purple
- Billing: Pink/Magenta
- Reliability: Deep Orange
- Integration: Teal

These colors are designed to be easily distinguishable and consistent across all charts and visualizations.

#### Integration Questions

**Q: Can I connect Cloudflare-cerebro to JIRA?**
A: Tickets display JIRA links when available. For full integration capabilities, contact your administrator.

**Q: Can I get notifications in Slack or email?**
A: Alerts are available in the Needs Attention overlay within Cloudflare-cerebro. For external notifications, check with your administrator about available options.

**Q: Can I connect other tools to Cloudflare-cerebro?**
A: Integration options depend on your organization's setup. Contact your administrator to discuss available integrations.

**Q: Can I integrate Cloudflare-cerebro with other tools?**
A: Integration capabilities depend on your organization's setup. Contact your administrator for integration options.

#### Technical Questions

**Q: What browsers can I use?**
A: Cloudflare-cerebro works with all modern web browsers including Chrome, Firefox, Safari, and Edge.

**Q: Do I need to install anything?**
A: No installation needed. Simply open Cloudflare-cerebro in your web browser.

**Q: Is my data secure?**
A: Data security follows your organization's policies. Contact your IT team if you have specific security concerns.

**Q: Can I use Cloudflare-cerebro without internet?**
A: No, an internet connection is required to access the latest feedback data.

**Q: Are there keyboard shortcuts?**
A: You can use Esc to close modals and overlays. Tab to navigate between elements. Full keyboard navigation is being improved.

---

## Best Practices for Smooth Performance

### Choosing the Right Time Range

**Recommended Ranges for Best Experience**:
- **Daily Triage**: Last 7 days (loads quickly, shows recent issues)
- **Weekly Review**: Last 30 days (good balance of detail and speed)
- **Monthly Analysis**: Last 90 days (comprehensive view)
- **Historical Analysis**: All time (use sparingly, loads more slowly)

**Tips**:
- Start with shorter ranges and expand if needed
- Avoid selecting very long custom date ranges (over 1 year)
- Don't change time ranges too frequently

### Using Filters Effectively

**Best Practices**:
1. **Start with Broad Filters**: Apply source or time filters first
2. **Then Narrow Down**: Add more specific filters as needed
3. **Use Multiple Filters**: Combine filters to find exactly what you need
4. **Clear When Done**: Remove filters you no longer need

**What to Avoid**:
- Applying too many overlapping filters
- Constantly adding and removing filters
- Using very broad filters when you need something specific

### Working with the Table

**Page Size Recommendations**:
- **10 rows**: Best for quick browsing and fastest loading
- **50 rows**: Good balance for most daily work (recommended)
- **100 rows**: Use when you need to see more at once (loads slower)

**Search Tips**:
- Apply filters first, then search within those results
- Use specific search terms for better results
- Clear search when you're done to see all filtered results

### Using Charts Efficiently

**Tips for Best Performance**:
- Use time ranges appropriate for your analysis
- Don't keep multiple charts expanded at once
- Close expanded chart views when you're done
- Limit the number of data series visible at once

**Understanding Chart Loading**:
- Longer time ranges show data in larger time buckets (less detail)
- Shorter ranges show more granular detail
- Balance the detail you need with how quickly you want results

### If Things Feel Slow

**Quick Fixes**:
- Reduce your time range
- Use fewer filters
- Choose a smaller page size (10 or 50 rows)
- Close other browser tabs
- Refresh the page

**When to Contact Support**:
- If the dashboard consistently loads slowly
- If charts don't display properly
- If filters stop working
- If you see error messages

---

## Accessibility

### Keyboard Navigation

#### Available Shortcuts

**Modal Navigation**:
- **Esc**: Close modals and overlays
- **Tab**: Navigate between elements
- **Enter**: Activate buttons/links
- **Arrow Keys**: Navigate dropdowns (where supported)

**Table Navigation**:
- **Tab**: Move between filter controls
- **Enter**: Activate buttons
- **Space**: Toggle checkboxes
- **Arrow Keys**: (Not fully implemented)

#### Screen Reader Support

**ARIA Labels**:
- Buttons have descriptive labels
- Charts have alt text
- Tables have headers
- Modals have titles

**Semantic HTML**:
- Proper heading hierarchy
- Form labels
- Button roles
- Landmark regions

### Visual Accessibility

#### Color Contrast

**Standards**:
- Text meets WCAG AA standards
- Badges have sufficient contrast
- Charts use distinguishable colors
- Focus indicators are visible

#### Visual Indicators

**Focus States**:
- Visible focus rings
- High contrast borders
- Clear selection states

**Status Indicators**:
- Color + text labels
- Icons + tooltips
- Multiple indicators

### Assistive Technologies

#### Screen Readers

**Compatibility**:
- Works with NVDA (Windows)
- Works with JAWS (Windows)
- Works with VoiceOver (Mac/iOS)
- Works with TalkBack (Android)

**Best Practices**:
- Use semantic HTML
- Provide alt text
- Use ARIA labels
- Test with screen readers

#### Keyboard-Only Navigation

**Support**:
- All functions accessible via keyboard
- Logical tab order
- Skip links (where applicable)
- Focus management

**Limitations**:
- Some advanced interactions require mouse
- Drag-to-select requires mouse
- Some chart interactions limited

### Accessibility Features

#### High Contrast Mode

**Browser Support**:
- Respects system high contrast settings
- Adjusts colors automatically
- Maintains readability

#### Zoom Support

**Browser Zoom**:
- Works up to 200% zoom
- Layout remains usable
- Text remains readable
- Charts scale appropriately

#### Reduced Motion

**Respects Preferences**:
- Honors `prefers-reduced-motion`
- Reduces animations
- Maintains functionality
- Improves performance

### Improving Accessibility

#### User Settings

**Browser Settings**:
- Enable high contrast
- Adjust zoom level
- Configure screen reader
- Set reduced motion preference

#### Best Practices

**For Users**:
- Use keyboard navigation
- Enable screen reader
- Adjust browser zoom
- Use browser accessibility features

**For Developers**:
- Test with screen readers
- Verify keyboard navigation
- Check color contrast
- Validate ARIA labels

---

## Appendix

### Keyboard Shortcuts

Currently not implemented, but potential shortcuts:
- `/` - Focus search bar
- `Esc` - Close modals/overlays
- `Ctrl/Cmd + F` - Browser search (not table search)

### Browser Compatibility

- **Chrome**: Fully supported
- **Firefox**: Fully supported
- **Safari**: Fully supported
- **Edge**: Fully supported

### Data Refresh

- **Automatic**: Data refreshes on page load
- **Manual**: Click refresh button in header
- **Frequency**: Real-time updates not available (refresh required)

### Export Formats

- **CSV**: Available for all exports (works with Excel and Google Sheets)
- **Other Formats**: Contact your administrator for additional export format options

### Mobile Support

- **Responsive Design**: Partially supported
- **Mobile Navigation**: Available
- **Table View**: Scrollable on mobile
- **Filters**: Accessible via mobile menu

#### Mobile-Specific Features

**Touch Interactions**:
- Tap to select
- Swipe to scroll
- Pinch to zoom (browser-level)
- Long-press for context (limited)

**Mobile Limitations**:
- Drag-to-select on charts may be difficult
- Small screen limits visibility
- Filter panel may be cramped
- Table scrolling can be challenging

**Mobile Best Practices**:
- Use portrait orientation
- Focus on one section at a time
- Use filters to reduce data
- Export for detailed analysis
- Use desktop for complex analysis

### Browser-Specific Notes

#### Chrome
- **Best Performance**: Optimized for Chrome
- **Features**: All features supported
- **Extensions**: May interfere with some features
- **Version**: Chrome 90+ recommended

#### Firefox
- **Full Support**: All features work
- **Performance**: Slightly slower than Chrome
- **Extensions**: Privacy extensions may block features
- **Version**: Firefox 88+ recommended

#### Safari
- **Full Support**: All features work
- **Performance**: Good performance
- **Privacy**: May block some tracking
- **Version**: Safari 14+ recommended

#### Edge
- **Full Support**: All features work
- **Performance**: Similar to Chrome
- **Compatibility**: Excellent compatibility
- **Version**: Edge 90+ recommended

### Data Limits

#### Practical Limits

**Recommended Limits**:
- **Time Range**: Up to 90 days for optimal performance
- **Table Rows**: 50 rows per page recommended
- **Filters**: 5-10 filters maximum
- **Export**: Up to 10,000 rows recommended

**Maximum Limits**:
- **Time Range**: All time (may be slow)
- **Table Rows**: 100 rows per page
- **Filters**: No hard limit (performance degrades)
- **Export**: No hard limit (may timeout)

#### Performance Thresholds

**Fast** (<1 second):
- Last 7 days
- 10-50 rows
- 1-3 filters
- Single chart

**Moderate** (1-3 seconds):
- Last 30 days
- 50-100 rows
- 3-5 filters
- Multiple charts

**Slow** (>3 seconds):
- All time
- 100+ rows
- 5+ filters
- Expanded charts

### Error Messages

#### Common Error Messages

**"Failed to load feedback"**:
- **Cause**: Connection issue or server problem
- **Solution**: Refresh the page, check your internet connection
- **Prevention**: Use a stable internet connection

**"Too many requests"**:
- **Cause**: Refreshing too quickly
- **Solution**: Wait a moment and try again
- **Prevention**: Don't click refresh multiple times rapidly

**"Data not available"**:
- **Cause**: No data in selected range
- **Solution**: Adjust filters or time range
- **Prevention**: Check data availability first

**"Filter combination invalid"**:
- **Cause**: Conflicting filters
- **Solution**: Clear and reapply filters
- **Prevention**: Understand filter logic

### Security Considerations

#### Data Privacy

**What Data is Stored**:
- Filters in URL (local)
- No personal data stored locally
- Session data only

**What Data is Transmitted**:
- Your filter selections
- Search terms you enter
- Requests to load feedback data

**Best Practices**:
- Don't share URLs with sensitive filters
- Clear browser data regularly
- Use incognito mode if needed
- Follow organizational policies

#### Access Control

**Current Implementation**:
- No authentication required
- Public access (if deployed publicly)
- No user roles

**Production Considerations**:
- Implement authentication
- Role-based access control
- Audit logging
- Data encryption

### Integration Possibilities

#### Potential Integrations

**Support Systems**:
- Zendesk
- Intercom
- Freshdesk
- Custom support tools

**Project Management**:
- JIRA (partial support)
- Linear
- Asana
- Trello

**Communication**:
- Slack
- Microsoft Teams
- Discord (already supported)
- Email (already supported)

**Analytics**:
- Google Analytics
- Mixpanel
- Amplitude
- Custom analytics

#### Integration Options

**Available Integrations**:
- Export data for analysis in other tools
- Share filtered views with team members
- Connect to project management tools (contact administrator)

**Common Use Cases**:
- Export data for reporting
- Share views with stakeholders
- Integrate with team workflows
- Create custom reports

### Version History & Updates

#### Version 1.0.0 (Current)

**Features**:
- Overview dashboard
- Business Metrics page
- View Tickets table
- Advanced filtering
- AI insights
- CSV export
- Trend analysis
- Needs Attention overlay

**Known Limitations**:
- No ticket editing
- No real-time updates
- Limited mobile support
- No bulk actions
- No custom dashboards

#### Future Roadmap

**Planned Features**:
- Real-time updates
- Ticket editing
- Enhanced mobile support
- Bulk actions
- Custom dashboards
- More integrations
- Advanced analytics
- User preferences

**Improvement Areas**:
- Performance optimization
- Accessibility enhancements
- Mobile experience
- Integration capabilities
- Customization options

---

## Support & Feedback

### Getting Help

1. **User Guide**: Click User Guide button (📘) in header
2. **Documentation**: See README.md for technical details
3. **Issues**: Report bugs via GitHub issues

### Providing Feedback

- Use the feedback system itself!
- Submit via Support channel
- Contact product team directly

---

## Version History

- **Current Version**: 1.0.0
- **Last Updated**: January 2026
- **Features**: Overview, Business Metrics, View Tickets, AI Insights

---

---

## Quick Reference

### Common Tasks

#### View Critical Issues
1. Click bell icon (🔔) in header
2. Review "Active Alerts" tab
3. Click alert to see details
4. Filter table by urgency=Critical

#### Export Data for Report
1. Apply desired filters
2. Verify row count
3. Click "Download CSV"
4. Open in Excel/Sheets
5. Format and analyze

#### Compare This Week vs Last Week
1. Go to Business Metrics page
2. Set time range to "Last 7 days"
3. Enable "Compare" toggle
4. Review delta indicators
5. Export comparison data

#### Find Trending Issues
1. Click bell icon (🔔)
2. Go to "Emerging Issues" tab
3. Review growth rates
4. Click "View Tickets" for details
5. Assign to appropriate team

#### Filter by Customer Segment
1. Open filter panel
2. Find "Customer Segments" section
3. Select segment(s)
4. Apply filters
5. Review filtered results

### Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Close Modal | `Esc` |
| Navigate Elements | `Tab` |
| Activate Button | `Enter` |
| Toggle Checkbox | `Space` |
| Focus Search | (Not implemented) |

### Filter Combinations

#### Critical Unresolved Tickets
- Status: Unresolved, In Progress
- Urgency: Critical
- Time: Last 7 days

#### Enterprise Customer Issues
- Segment: Enterprise
- Status: Unresolved
- Time: Last 30 days

#### Performance Issues
- Issue Type: Performance
- Urgency: High, Critical
- Time: Last 7 days

#### Feature Requests
- Issue Type: Feature
- Sentiment: Positive, Neutral
- Time: All time

### URL Patterns

When you apply filters, the web address automatically updates. Here are examples of how filters appear in the address:

#### Filter by Source
- Example web address: /?source=email&time=7d
- This filters to show Email tickets from the last 7 days

#### Multiple Filters
- Example web address: /?source=discord,github&status=unresolved&urgency=critical&time=7d
- This filters to show Discord or GitHub tickets that are Unresolved and Critical from the last 7 days

#### Custom Date Range
- Example web address: /?time=custom&start=2026-01-01&end=2026-01-20
- This filters to show tickets from January 1, 2026 to January 20, 2026

**Note**: You don't need to manually create these addresses. Just apply your filters and copy the address from your browser's address bar.

### Priority Bands

| Band | Score Range | Color | Meaning |
|------|-------------|-------|---------|
| P0 | ≥80 | Red | Critical, immediate action |
| P1 | 60-79 | Orange | High priority, urgent |
| P2 | 40-59 | Blue | Medium priority |
| P3 | <40 | Gray | Low priority |

### Status Meanings

| Status | Color | Meaning |
|--------|-------|---------|
| Unresolved | Red | New or not yet addressed |
| In Progress | Orange | Currently being worked on |
| Resolved | Green | Completed and closed |
| Ignored | Gray | Won't be addressed |

### Urgency Levels

| Level | Color | Response Time |
|-------|-------|---------------|
| Critical | Red | Immediate |
| High | Orange | Within 24 hours |
| Medium | Blue | Within 1 week |
| Low | Gray | When possible |

### Customer Segments

| Segment | Color | Priority |
|---------|-------|----------|
| Enterprise | Orange | Highest |
| Pro | Blue | High |
| Free | Green | Standard |
| Unknown | Gray | Standard |

### Issue Types

| Type | Typical Owner | Common Sources |
|------|---------------|----------------|
| Bug | Engineering | GitHub, Support |
| Feature | Product | Discord, Forum |
| Performance | Engineering | Support, GitHub |
| UX | Product/Design | Support, Email |
| Documentation | Product | Forum, GitHub |
| Pricing | Support | Email, Support |
| Account Access | Support | Email, Support |
| Billing | Support | Email, Support |
| Reliability | Engineering | Support, GitHub |
| Integration | Engineering | GitHub, Support |

### Time Range Presets

| Preset | Duration | Best For |
|--------|----------|----------|
| Last 24 hours | 1 day | Daily triage |
| Last 7 days | 1 week | Weekly review |
| Last 30 days | 1 month | Monthly analysis |
| All time | ~14 years | Historical analysis |
| Custom | Variable | Specific periods |

### Chart Time Ranges

| Range | Bucket Size | Best For |
|-------|-------------|----------|
| 1 day | 1 hour | Hourly analysis |
| 7 days | 6 hours | Daily patterns |
| 1 month | 1 day | Daily trends |
| 3 months | 1 week | Weekly trends |
| 6 months | 2 weeks | Bi-weekly trends |
| 1 year | 1 month | Monthly trends |

### Contact & Support

**Help Resources**:
- User Guide: Click 📘 button in header (blue background for easy identification)
- Documentation: This guide
- Technical Docs: README.md
- Issues: GitHub issues (if applicable)

**Getting Help**:
1. Check this guide first
2. Review Troubleshooting section
3. Click User Guide button in header
4. Contact support team
5. Report bugs via GitHub

---

**Thank you for using Cloudflare-cerebro!** We hope this comprehensive guide helps you effectively manage product feedback and make data-driven decisions. For the latest updates and features, check the version history section.
