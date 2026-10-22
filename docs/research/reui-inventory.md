# ReUI inventory: Invest Portal (One Invest)

> Date: 2026-10-18 · Source: ReUI MCP (`search`, `get_block`, `get_examples`, `get_thumbnail`, `validate_usage`) plus `npx shadcn@latest search @reui` run in `app/`. Every name below was checked with `validate_usage` or `get_block` and exists.
> Read-only: nothing installed, no repo file changed.

## 0. Registry and license status

| Item | Status |
|---|---|
| Registry config | `app/components.json` → `registries.@reui.url = https://reui.io/r/{style}/{name}.json`, header `Authorization: Bearer ${REUI_LICENSE_KEY}` ✅ |
| License key | `REUI_LICENSE_KEY` is set in `app/.env.local` (24 characters, value not shown) and is also exported in the shell environment ✅ |
| Git safety | `app/.env.local` is ignored by `.gitignore:9 .env*` ✅ |
| Plan seen by MCP | **pro**: all 654 blocks can be found and installed. **Motion Icons need Ultimate and are NOT available**, so keep `lucide` (`iconLibrary` in components.json). |
| shadcn CLI | `npx shadcn@latest search @reui -q app-shell` in `app/` works with the key and lists `app-shell-1` to `app-shell-35`. |
| shadcn MCP | Sees **no registries**. It runs from the repo root, where there is no `components.json`. Use the CLI from `app/` instead. Nothing is broken. |
| ⚠️ Style mismatch | `components.json` uses `"style": "base-nova"` (Base UI), but the ReUI MCP reports `projectStyle.current = radix-nova`. Its `previewUrl` and `docsUrl` links therefore point to the **radix** variant. Installs are not affected, because the CLI reads `base-nova`. To fix it, send `X-Reui-Style: base-nova` (or `?style=base-nova`) in the ReUI MCP server config. DESIGN_RULES already warns about the base-nova vs radix trap. |
| Catalogue size | 654 blocks · 1264 free `c-*` examples · 27 free components · 667 icons (Ultimate only) |

## 1. Shared rules from the ReUI skill (apply before building)

- **Surface:** use one container family per screen. App pages in the Invest Portal should be **Frame-led**: `stats-*`, `chart-*` and `data-grid-*` Pro blocks are almost all `surface: frame`. The free `c-chart-*` and `c-card-*` examples (already installed: c-chart-2/16/19, c-card-15) are **Card**-based. On a Frame page, move the chart body into a `FramePanel` and never nest a Card inside a Frame. Marketing pages (hero, how-it-works, pricing) are surface-neutral or Card.
- Each block ships demo data and its own `min-h-svh` wrapper, max width and padding. Remove those inside the shell.
- Shells call `useTheme`, so the app must mount the `next-themes` ThemeProvider.
- Tables use `data-grid`, filtering uses `filters`, toasts use `sonner`, modals use `Dialog`. Never hand-roll these. Status colours come from `@reui/badge` / `@reui/alert` variants.
- Every data region needs empty, loading (a Skeleton in the real layout) and error (Retry) states.

---

## 2. App shell: all 35 `app-shell-*` compared

Legend: **Nav** = TOP (top bar only), SIDE (sidebar), BOTH. **⌘K** = a command-search dialog is built in. **Mobile** = what the shell does on small screens. All 35 are Pro.

| Shell | Label | Nav | ⌘K | Mobile | Density / fit | Verdict for Invest |
|---|---|---|---|---|---|---|
| 1 | Icon Rail Dashboard | SIDE (icon-collapsible) + breadcrumb | – | shadcn Sidebar offcanvas | medium, SaaS admin | ✗ sidebar takes width needed for maps |
| 2 | Floating Sidebar Admin | SIDE floating | ✅ | Sidebar sheet | medium | ✗ admin feel |
| 3 | Project Tracker Sidebar | SIDE inset (Frame) | ✅ | Sidebar sheet | medium-dense | ✗ |
| 4 | Mail Inbox | SIDE + 440px list | – | – | dense | ✗ domain-specific |
| 5 | Calendar Contacts Hub | SIDE dual-pane | – | – | dense | ✗ |
| 6 | Team Calendar Panel | SIDE dark rail + right panel | ✅ | sheet | dense | ✗ |
| 7 | Environment Switcher | BOTH (breadcrumb switchers + sidebar) | ✅ | Sidebar sheet | dense dev-ops | ✗ (Ops candidate) |
| 8 | Inventory Admin | SIDE rail + secondary nav | ✅ | Sheet | dense | ✗ (Ops candidate) |
| 9 | Team Presence Workspace | SIDE dark inset | ✅ | sheet | medium | ✗ |
| 10 | AI Agents Console | SIDE inset (Frame) | ✅ | sheet | medium | ✗ (Ops/agents alternative) |
| 11 | Operations Workbench | SIDE + resizable + bottom sheet | – | use-mobile | very dense | ✗ (Ops alternative) |
| 12 | Apps Grid Header | SIDE rail + header | ✅ | sheet | medium | ✗ |
| 13 | Community Feed App | BOTH (full-width header with centred search + icon sidebar) | search field | sheet | light | ◯ possible, but the sidebar is unnecessary |
| 14 | View Toolbar Workspace | SIDE rail + secondary + view tabs | – | – | dense | ✗ |
| 15 | Pinnable Favorites Nav | BOTH (dark topbar + sidebar) | – | sheet | medium | ✗ |
| 16 | Dual Sidebar Dashboard | SIDE dual | search | sheet | medium | ✗ |
| 17 | Model Picker Chat | SIDE | – | – | – | ✗ AI chat |
| 18 | To-Do AI Assistant | SIDE + chat panel | – | Sheet | – | ✗ |
| 19 | Scheduling Planner | SIDE + calendar | – | – | – | ✗ |
| 20 | Webmail Client | SIDE | – | – | – | ✗ |
| 21 | Resizable AI Chat | SIDE resizable | palette | sheet | – | ✗ |
| 22 | Fleet Operator Console | rail + photo banner + pill nav | – | Sheet < lg | showy | ✗ too decorative |
| 23 | Team Project Switcher | BOTH | – | Sheet | dense ops | ✗ |
| 24 | Ops Presence Console | BOTH (topbar section pills + sidebar) | route palette | nav folds into **bottom Drawer** | dense ops | ◯ good mobile pattern, but ops-flavoured |
| 25 | Mission Control | rail + tabs (mixed surface) | – | – | dense | ✗ |
| **26** | **Security Scope Console** | **BOTH (top bar: workspace picker + section pills + ⌘K + notifications + action; scope-tree sidebar)** | **✅** | **Drawer** | **dense SOC** | **→ Ops Portal** |
| 27 | Route Search Sidebar | SIDE only, no top bar (⌘F) | ⌘F | Sheet | dense | ✗ (Ops alternative) |
| 28 | Section Tabs Admin | BOTH (top icon section tabs + grouped rail in one rounded panel) | ✅ | tabs → dropdown, rail → **Sheet < lg** | medium | ◯ **runner-up for Invest** |
| 29 | Section Tile Rail | rail only, no header | – | Sheet < lg | dense | ✗ |
| **30** | **Top Navbar Admin** | **TOP only, no sidebar: icon sections + page header with count badges + 8-tab view track** | search icon (no dialog wired) | **sections and view tabs fold into "Sections" / "Views" dropdowns** | **light, roomy** | **✅ Invest Portal** |
| 31 | Folder Tab Workspace | glass rail + SVG tabs | – | Sheet | showy | ✗ |
| 32 | Endpoint Protection | BOTH + AI assistant | – | Sheet | dense SOC | ✗ |
| 33 | Fleet Center | dark side card | – | Sheet | dense | ✗ |
| 34 | Invoice Matching | PO tree + AI advisor | – | Sheet | dense | ✗ |
| 35 | Whiteboard Workspace | icon rail + board tabs | – | left Sheet / bottom Drawer | – | ✗ |

### Recommendation: Invest Portal = `@reui/app-shell-30` (Pro)

[preview](https://reui.io/preview/radix/app-shell-30) · install `npx shadcn@latest add @reui/app-shell-30`

Why:
1. **Top nav, no sidebar.** Finder (list and map split) and the Insight charts get the full page width, and the layout reads as a public product (as on AirDNA), not an admin console. A sidebar would cost 240px exactly where the map needs it.
2. **The page header matches Insight.** Title plus count badges map directly to "Hà Nội · Market Score 82 · 1.240 listing · 30 phường", with actions on the right (Save / Share).
3. **The 8-tab view track matches the 8 Insight tabs exactly:** Overview · Revenue · Occupancy · ADR · Supply · Seasonality · Submarkets · Listings.
4. **Mobile:** icon sections and view tabs fold into two dropdowns, so there is no horizontal page scroll.
5. **Density:** light and airy, which suits read-only investors.

What to add or change:
- **⌘K:** not wired in shell-30. Bind the top-bar search icon to `c-command-5` (free; trigger plus Kbd hint and rows with a type badge, which can show market / phường / listing), or take the dialog from `navbar-4`. For typed location search, use `c-autocomplete-9` (free; debounced with spinner and result count).
- Replace `NAV_SECTIONS` with Finder · Insight · Yield · Saved, `WORKSPACE_TABS` with the 8 tabs, and `PAGE_STATS` with market counts. Remove "Onboard Robot / New Mission / Open Chat" and use Save / Share / avatar (or Đăng nhập when signed out).
- Pages without tabs (Finder, Yield, Saved) hide the view track.

Runner-up: `app-shell-28`. It has ⌘K built in and the rail moves into a Sheet below lg. Choose it only if the portal later needs a persistent left rail (many saved lists or a long phường tree), because it narrows the map.

### Lighter marketing shell (home `/`)

`@reui/navbar-12` (Pro): marketing top bar with mega-menu dropdowns, a Pricing link and a Get Started button. The Product menu becomes Finder / Insight / Yield, and Company becomes About / Methodology. Alternative: reuse the top bar of app-shell-30 without the page header. **Footer: ReUI has no footer block (gap).** Compose it from Separator, links and a muted bottom row; `contact-4` (Pro, column band) can serve as a column layout reference.

### Ops Portal = `@reui/app-shell-26`: confirmed suitable

- The top bar (workspace picker, section pills, ⌘K, notifications feed, primary action) maps to: city or environment picker · Collections / Pipeline / Quality / Agents / Sources pills · ⌘K · collector-failure alerts · "Run Scan" renamed to "Chạy thu thập".
- The scope-tree sidebar (icon scope tabs, collapsible tree, count/status badges) maps to sources → cities → phường with health badges. Dense SOC density is right for 1–2 operators.
- Caveats: it adds `@headless-tree/core` and `@headless-tree/react` plus `@reui/sortable`. Drag-to-reorder and add/duplicate scopes are more than Ops needs, so disable them. Mobile uses a Drawer.
- Alternatives: `app-shell-27` (same scope tree, no top bar, ⌘F) or `app-shell-11` (ops workbench with resizable panes and a bottom sheet, for log or pipeline views later). Pair it with `agent-activity-2/5` and `ai-usage-1` (candidates, not installed; find them with the MCP `search`).

---

## 3. Per-need recommendations

Free = c-* examples and the 27 components (no license needed). Pro = blocks (covered by the current license).

### 3.1 Global shell pieces

| Need | Recommended (verified) | Free/Pro | Why | Alternative |
|---|---|---|---|---|
| App shell | `app-shell-30` | Pro | Top nav, page header with badges, 8 view tabs, mobile dropdown fold | `app-shell-28` (Pro) |
| ⌘K command palette | `c-command-5` | Free | Search-style trigger with Kbd hint; rows show name, muted path and type badge (Market/Phường/Listing) | `c-command-8` (Free, recent + favourites = recently viewed markets) |
| Location search box | `c-autocomplete-9` (`autocomplete` component) | Free | Debounced async lookup with spinner, error and result count | `c-autocomplete-11` (Free, lg size for a page-leading search) |
| Account menu | built into app-shell-30 (avatar DropdownMenu) | Pro | Keep the shell's own | `navbar-3` avatar menu with light/dark/system toggle (Pro) |
| Mobile nav | app-shell-30 fold-to-dropdown, plus `c-sheet-1` for a full menu | Pro/Free | No horizontal scroll; sheet for long lists | `app-shell-24` pattern (bottom Drawer) |
| Marketing top bar | `navbar-12` | Pro | Mega menu, Pricing link, Get Started CTA | `navbar-4` (Pro, centred ⌘K bar) |
| Toasts (Saved / Copied) | `c-sonner-1` | Free | `sonner` is the toast owner | – |

### 3.2 Home / landing

| Need | Recommended | Free/Pro | Why | Alternative |
|---|---|---|---|---|
| Hero with market search | `hero-8` | Pro | Copy on the left, inline InputGroup (swap the email field for `autocomplete` location search), product console on the right (replace with a real Insight screenshot) | `hero-12` (Pro, centred + brand cloud + wide console) |
| Featured markets | `card-29` | Pro | One Frame of metric cells, each with value, delta badge and area chart, ready for "Hà Nội / Đà Nẵng / HCM" | `chart-15` (Pro, KPI trend cards) |
| How it works | `how-it-works-1` | Pro | 3 numbered steps (Find → Analyse → Estimate yield), stacks on mobile | `how-it-works-4` (Pro, tabbed product tour) |
| Pricing teaser | `pricing-5` | Pro | 4 plan cards, Monthly/Yearly, "Most Popular" badge, links to compare and FAQ | `pricing-4` (Pro, 3 tiers) |
| CTA band | `cta-2` | Pro | Split copy and image, two buttons, feature strip | `cta-14` (Pro, newsletter signup) |
| FAQ | `faq-6` | Pro | Accordion plus support footer, in a Frame | – |
| Footer | **GAP** | – | No footer category in ReUI | Compose from shadcn Separator + links (see §4) |

### 3.3 Market Finder (`/vn`, `/vn/[market]/map`)

| Need | Recommended | Free/Pro | Why | Alternative |
|---|---|---|---|---|
| Ranked list (data grid) | `data-grid-base-2` | Pro | Pinned rows, Filters builder, **score Progress bars + sparklines**, column show/hide/resize. Fits Market Score + RevPAR trend | `data-grid-advanced-1` (Pro, KPI band above the grid that follows filters, in-cell sparklines, row detail sheet) |
| Filter bar (province, property type, bedrooms, score range) | `filters` component (`c-filters-1`) + `cascader` (`c-cascader-1`) for Tỉnh → Thị trường → Phường + `c-slider-6` range for score | Free | `filters` owns filtering (one FilterQuery tree); cascader handles the nested geography | `filter-sidebar-5` (Pro, slide-out Sheet with range slider and chips, good for mobile) |
| Sort | built into `data-grid` (`c-data-grid-11` already installed) | Free | – | `c-data-grid-34` (Free, server-side sort, search, filter, pagination) |
| Compare selection | `c-data-grid-7` (row selection) + `comparison-6` tray | Free + Pro | Checkbox rows feed up to 4 compare slots with "Clear all" | Selection badge in the page header only |
| List + map split | `c-resizable-5` (desktop) + `c-toggle-group-1` List/Map switch (mobile) | Free | Resizable split with a pill handle; mobile shows one pane | Fixed CSS grid 5/7 |
| Choropleth map | **GAP: MapLibre** (`components/finder-map.tsx`) | – | ReUI has no map blocks (search for "map/choropleth" finds nothing) | – |

### 3.4 Market Insight dashboard (`/vn/[market]`)

| Need | Recommended | Free/Pro | Why | Alternative |
|---|---|---|---|---|
| Page reference (whole page) | `dashboard-7` | Pro | KPI sparkline cards + stacked area revenue + channel bars + sortable DataGrid; the closest full Overview | `solution-analytics-1` (Pro) |
| Header with breadcrumb + Save/Share | `navbar-6` | Pro | Breadcrumb (VN › Hà Nội › Ba Đình), Share, period picker, **Compare toggle**, ⌘K | Header of `solution-analytics-8` (watch toggle = Save) |
| Section tabs (8) | app-shell-30 view track | Pro | Built in | `c-tabs-1` (Free) |
| KPI stat cards with trend | `stats-1` | Pro | 4-up Frame, large value, ↑/↓ delta badge, "vs last month" | `chart-2` (Pro, KPI strip with corner sparklines) · `c-card-15` (Free, installed, Card) |
| Timeseries (Overview) | `chart-6` | Pro | KPI tiles (Revenue/Occupancy/ADR/RevPAR) switch one area trend, previous-period ghost line, event annotations (Tết, holidays), 7D–90D range | `c-chart-16` (Free, installed) |
| Timeseries (Revenue tab) | `chart-22` | Pro | Revenue vs previous period / last year, KPI deltas, running total, CSV | `c-chart-13` (Free) |
| Per-metric tab template (Revenue/Occupancy/ADR) | `solution-analytics-8` | Pro | One metric: 4-tile KPI rail, trend vs target line, cohort bars (by bedrooms), change timeline | `chart-6` alone |
| Bar charts (ADR by bedrooms / property type) | `c-chart-2` | Free (installed) | Grouped bars | `chart-9` (Pro, stacked yearly with KPIs) |
| Donut (listing mix / revenue split) | `chart-13` | Pro | Ring + rows with share and change, period switch | `c-chart-19` (Free, installed) |
| Radial gauge: Market Score | `c-chart-25` | Free | 0–100 radial bars with labels; one bar = score, three bars = sub-scores | `chart-8` (Pro, segmented SLO rings with redline band; heavier) |
| Seasonality | `chart-36` | Pro | Monthly bars + line + dashed target + **hatched forecast months** | `data-grid-grouping-3` (Pro, **colour-graded heatmap cells**, works as a month × year occupancy heatmap) |
| Supply (active listings over time) | `c-chart-14` | Free | Stacked area by property type | `chart-17` (Pro) |
| Top submarkets table | `c-data-grid-11` | Free (installed) | Sortable; add a Progress column for score | `data-grid-base-2` (Pro) |
| Mini-map | **GAP: MapLibre** (`components/mini-map.tsx`) | – | – | – |

### 3.5 Submarket (phường) insight (`/vn/[market]/[submarket]`)

Same template as 3.4. Differences: the `navbar-6` breadcrumb gains one level; the Submarkets tab is replaced by "Nearby phường" (`c-data-grid-11`); the Market Score radial (`c-chart-25`) shows submarket vs market as 2 bars. Alternative: `solution-analytics-8` as the whole page for thin data.

### 3.6 Listing detail (`/listing/[id]`)

| Need | Recommended | Free/Pro | Why | Alternative |
|---|---|---|---|---|
| Gallery + summary box | `product-detail-5` | Pro | Sticky thumbnail gallery + dense side box (repurpose buy box as ADR / occupancy / revenue / Airbnb link), specs, rating breakdown | `product-detail-1` (Pro, carousel + tabbed specs) |
| Occupancy calendar heatmap | **GAP.** Closest: `form-5` (Pro) has an activity heatmap pattern to copy | Pro | Copy its heatmap cell grid, recolour by booked/available/blocked | `schedule-8` (Pro, month calendar with per-day dots) or shadcn `calendar` with day modifiers |
| Price chart | `chart-4` | Pro | Daily line, range tabs, **high/low markers**, benchmark overlay = market ADR | `c-chart-17` (Free, forecast line) |
| Comps | `data-grid-base-1` | Pro | Avatar/photo rows, sortable, trend tooltips | `comparison-1` (Pro, side by side) |

### 3.7 Yield / Rentalizer-like estimator (`/yield`)

| Need | Recommended | Free/Pro | Why | Alternative |
|---|---|---|---|---|
| Input form | `form-11` | Pro | Label-control rows + **gradient summary banner that mirrors inputs live** | `wizard-2` (Pro, Frame stepper: address → property → costs) |
| Inputs | `c-autocomplete-9` (address), `c-number-field-1` (bedrooms, price), `c-slider-6` | Free | Components own the controls | shadcn Input + Select |
| Report KPIs | `stats-1` | Pro | Gross yield, net yield, est. revenue, occupancy | `chart-2` |
| Report charts | `chart-36` (monthly revenue vs costs + margin line + forecast) + `chart-13` (cost split donut) | Pro | Revenue/opex/margin maps directly to STR P&L | `c-chart-2` + `c-chart-19` |
| Comps | `data-grid-base-2` | Pro | Score/progress + sparkline per comp | `c-data-grid-11` |

### 3.8 Saved, compare, auth, states

| Need | Recommended | Free/Pro | Why | Alternative |
|---|---|---|---|---|
| Saved / watchlist | `wishlist-2` | Pro | Saved grid with **signal badges** (price-drop → "ADR ↑", restock → "Score ↑") and status tabs | `list-9` (Pro, Frame list) |
| Compare markets side by side | `comparison-1` | Pro | Grouped spec rows, **sticky labels**, removable columns, scroll area | `comparison-2` (Pro, two-up with auto winner) |
| Login | `auth-4` | Pro | Frame card, email/password + social, matches Frame surface | `auth-15` (Pro, magic link) |
| Register | `auth-5` | Pro | Trial signup split page with Frame | `auth-20` (Pro, Card) |
| Empty: no results | `empty-state-2` | Pro | Suggestion chips ("Thử: Đà Nẵng, Hội An…") + Refine filters | `c-empty-2` (Free) |
| Empty: no saved markets | `c-empty-11` | Free | Bookmarks empty with one "Browse markets" action | `empty-state-1` (Pro) |
| Locked / paywall teaser | `empty-state-5` (Frame split: copy + **preview panel**, put a blurred chart there) + `pricing-7` (upgrade dialog) | Pro | Teaser in place, plan picker in a modal | `pricing-8` (Pro, framed plan cards dialog) |
| Loading skeletons | `c-skeleton-6` (stats row), `c-skeleton-5` (table), `c-skeleton-2` (chart card) | Free | Skeleton in the real layout | Built-in loading of `data-grid-filtering-1` (Pro) |
| Error state | `c-alert-1` (`@reui/alert` destructive + Retry action) | Free | Alert owns state colour | `c-empty-3` (Free, 404 with search) |
| Share link dialog | **GAP** (no share-link block) | – | Compose `Dialog` + `InputGroup` + `@reui/use-copy-to-clipboard` + sonner | `dialog-8` (Pro, invite pattern) |

---

## 4. Gaps and the minimal shadcn base to compose them

| Gap | Compose with |
|---|---|
| **Maps** (Finder choropleth, mini-map, listing pins) | Keep MapLibre (`finder-map.tsx`, `mini-map.tsx`, `map-worker.ts`). Wrap in `@reui/frame` `FramePanel dense`; layer switch via `toggle-group`; hover readout via `hover-card` or `popover`; legend = Badge row; loading = `skeleton` the map's size; error = `@reui/alert`. |
| **Occupancy calendar heatmap** | Copy the heatmap cell grid from `form-5`, or shadcn `calendar` with `modifiers` / `modifiersClassNames` (booked/available/blocked using semantic tokens), plus `tooltip` per day. |
| **Footer** | `separator` + link columns + `button variant="link"`; the "Nội bộ" link to `/ops` goes here only (portals.md rule 4). |
| **Share dialog** | `dialog` + `input-group` + `@reui/use-copy-to-clipboard` + `sonner`. |
| **Locked overlay on charts** | Chart in a `FramePanel` + `blur-sm pointer-events-none` layer + centred `empty` + `button` to `pricing-7`. |
| **Vietnamese labels** | `data-grid` has an `i18n` prop; `autocomplete` and `filters` take label props. Read `get_component` before wiring. |

Minimal shadcn base, beyond what is already in `components/ui`: `dialog, command, kbd, tabs, sheet, drawer, breadcrumb, toggle-group, resizable, slider, tooltip, hover-card, empty, input-group, field, progress, sonner, calendar, item`. Most of these are pulled in automatically as `registryDependencies` when the blocks are installed.

---

## 5. Top 15 blocks to install first (in order)

1. `app-shell-30`: Invest shell (Pro)
2. `navbar-6`: Insight header with breadcrumb, Share, Compare, ⌘K (Pro)
3. `stats-1`: KPI cards with trend (Pro)
4. `chart-6`: Overview metric switcher trend (Pro)
5. `data-grid-base-2`: Finder ranked grid with score bars and sparklines (Pro)
6. `c-chart-25`: Market Score radial (Free)
7. `chart-36`: Seasonality / yield P&L composed chart (Pro)
8. `chart-13`: Donut with breakdown rows (Pro)
9. `comparison-1`: Compare markets (Pro)
10. `c-command-5` + `c-autocomplete-9`: ⌘K and location search (Free)
11. `hero-8`: Home hero with inline search (Pro)
12. `navbar-12`: Marketing top bar (Pro)
13. `product-detail-5`: Listing gallery page (Pro)
14. `form-11`: Yield estimator form with live summary (Pro)
15. `auth-4`: Login (Pro)

Then states: `empty-state-2`, `empty-state-5` + `pricing-7`, `c-skeleton-5/6`, `c-alert-1`, `wishlist-2`. Then Ops: `app-shell-26`.

Install pattern (from `app/`): `npx shadcn@latest add @reui/<name> --yes`, then update the inventory in `.claude/skills/onehub-ui/catalog.md`.
