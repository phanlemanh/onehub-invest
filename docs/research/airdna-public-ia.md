# AirDNA — Public IA & Feature Study (for One Invest Invest Portal)

Researched 2026-10-18 from public sources only; no sign-in, no browser. `airdna.co` returns HTTP 403 to direct fetch, so marketing pages were read through a public reader proxy (r.jina.ai); the help center (help.airdna.co, Intercom) was fetched directly (63 articles). We studied structure only and copied no data.
**Tags:** **O** = observed verbatim in a source; **I** = inferred by us. Source keys are listed in §7.

---

## 1. Product map

| Module (app name) | Job it does | Primary user | Tier that unlocks it | Tag / src |
|---|---|---|---|---|
| **Home** | Re-open recently viewed markets and saved Rentalizer reports, jump to top investment/destination markets | all | Free | O [H-NAV] |
| **Find a Market** (country overview) | Map + ranked list of all markets in a country, sorted by Market Score by default | investor | Free (limited) | O [H-NAV][H-MT] |
| **Market Insights**: Overview / Occupancy / Revenue / Rates / Seasonality / Listings | Market- and submarket-level KPIs and charts | investor, host | Free: "Limited Market Insights". Paid: "Historical Market Insights" | O [M-PRC][H-NAV] |
| **Submarkets** | Neighborhood-level drill-down. For example, LA has 171 submarkets and Wyoming has 26 | investor | Paid (Research) per third-party source | O [M-SUB]; tier per [T-WEAR] |
| **Short-term Rentals** (listing explorer, also "All STR Listings" / "Top Listings") | Tile + map list of listings with ≥1 booking in the last 12 months, sortable by Revenue/Occ/ADR/Reviews | investor, host | "Property Performance" = Market Research | O [H-NAV][M-PRC][M-MI] |
| **For-Sale Properties** (US only) | MLS listings with an auto-attached Rentalizer projection, yield and zoning | investor | Browsing is Free; zoning needs Market Research / PM / Advanced | O [H-FS][H-ZON][M-PRC] |
| **Rentalizer** (Revenue Calculator) | 12-month projection of Revenue/Occ/ADR for any address from comps, plus expense calculator → NOI, cap rate | investor | Free "Limited"; paid "Customizable Rentalizer" (unlimited searches, own comps) | O [H-RZ][M-PRC] |
| **Rentalizer Agent** | AI underwriting report with six "skills": property analysis, comps with similarity score, guest reviews, market intel, events, regulations/HOA. Exports to PDF | investor | 5 reports (Market Research), 25 reports (PM) | O [H-AGT][M-AGT][M-PRC] |
| **Comps / Comp Sets** | Build or save sets of competitor listings: min 5 for analysis, up to 100 per set, unlimited sets. Aggregate performance, CSV export, "Run Rentalizer" | host, investor, PM | Paid to save and to see all metrics | O [H-CS][H-CSM] |
| **Performance Dashboard / My Performance** | Connect Airbnb or a PMS (Guesty, Hostaway, Uplisting, OwnerRez). Sections: Snapshot, Comparisons, Pacing, Bookings. Performance Score 10–100 vs comp set | host, PM | Free to connect; benchmarking is in the Host tier | O [H-PERF][H-PS][M-PRC FAQ] |
| **Adapt Pricing** (dynamic pricing, formerly Smart Rates / AirDNA Rates) | AI repricing synced to Airbnb/PMS | host, PM | $20/listing/month, 30-day trial | O [M-PRC][M-HOME] |
| **Top Property Managers** | Ranks PMs in a market (name/host ID, rating, reviews, property count, link). Not available at submarket level | PM, investor | Unclear. One third-party source says above Research | O [H-PM]; tier ? [T-BNB] |
| **Advanced Insights** | Multi-market list view with export, up to 5 comp sets overlaid on any graph, custom time frame 2017–2025 at monthly or yearly grain, 11 KPIs, draw/save custom regions | PM, analyst | Advanced (annual, sales-led) | O [M-ADV][M-HOME] |
| **Property Manager Tool / Owner Contact Details** | Pacing, competitor tracking, policy and review benchmarking, owner leads, branded revenue forecasts | PM | Property Manager (contact sales) | O [M-PRC][M-HOME] |
| **Enterprise: API + MCP, Tourism (DMO), Real-estate analytics** | Data feeds for lenders, funds, academics, DMOs | enterprise | Custom | O [M-PRC nav][M-HOME] |

**Plan ladder (O [M-PRC]):** Free $0 "free forever" → **Market Research** $125/mo or $34/mo billed $400/yr ("Great Value"; "Save 73%" annual) → **Host** (named only in the FAQ: benchmarking, competitor rate calendar, Uplisting for ≤3 listings) → **Property Manager** (6+ properties, contact sales). A separate "Advanced Solutions" toggle covers Advanced and Enterprise; we could not capture its content. The help center's older plan article ("Pro"/"Advanced") has been deleted, so names have drifted over time (O, search snippet only).
**Coverage claims (O [M-PRC][M-HOME]):** 15M+ listings, 120K+ markets, every plan includes all markets ("You never pay extra to research another market"), history back to 2014.
**Third-party tier depth (O [T-WEAR], unverified):** Free = 12 months of history. Research = 36 months, submarkets, draw-on-map, CSV, custom comps, pacing. Advanced = data back to 2017 plus a "Repeat Rent Index".

---

## 2. App navigation model

### 2.1 Global shell (O [H-NAV][H-MAP][H-DRAW])
| Region | Items |
|---|---|
| **Left nav panel** | Home · **Research** group (Find a Market, Market Insights sections, Rentalizer, Comps) · Performance Dashboard · Adapt Pricing |
| **Top bar** | Global **search**: markets, submarkets **and street addresses** in one box. An address jumps to Rentalizer (O [H-RZ]) |
| **Top-right** | **Flag icon** = country + currency switch (one control for both) · **initials menu** = Profile, Subscription & Billing (Stripe invoices), saved markets/submarkets, saved for-sale properties, connected listings and channels, Enterprise info, Help (chat) |
| **Inside a market (left nav sub-items)** | Overview · Short-term Rentals · For-Sale Properties · Occupancy · Revenue · Rates · Seasonality · Listings (incl. Top Property Managers) |
| **Inside Overview** | A row of metric tabs (Occupancy, Revenue, Rates, Seasonality) that anchor-jump to chart sections |

### 2.2 Geography hierarchy
**Country → Market → Submarket → Listing**, plus a user-drawn **Custom Region** that sits beside them.
- Markets are no longer city/zip based: they are "specific areas", and several towns can roll up into one market (e.g., "Poconos Mtns") (O [H-BND]).
- Submarket count depends on performance variability, not on administrative units (O [M-SUB]).
- Market types: Coastal, Mountains/Lakes, Suburban, Urban/Metro, Mid-sized city, Small city/Rural (O [H-MT]).
- Demand Drivers (US): each submarket carries ≤3 tags (golf, beach, ski, national park, university, military, winery, airport…) (O [H-FIL][M-BPTI]).
- App routes (O, from marketing deep links): `/data/{cc}?tab=markets|submarkets|for-sale-properties` · `/data/{cc}/{marketId}/overview` · `/data/{cc}/{marketId}/{submarketId}/overview` · `/data/{cc}/{marketId}/top-listings?listing_id=abnb_…&lat&lng&zoom` · `/data/my-rentalizer` · `/data/comp-sets` · `/data/my-listing/dashboard` · `/data/connect-listings`. IDs are opaque (`airdna-372`), not slugs (I: so there is no SEO value in app URLs).

### 2.3 Filters (O [H-FIL])
One global filter row, and "all data on the platform" re-computes when it changes. Order: **Market · Bed/Baths · Property Types · Price Tier · Amenities · … · All Filters** (right-side panel). A **bookmark icon saves named filter presets**, and a drawn custom region is saved as a filter too (O [H-DRAW]).

| Filter | Detail |
|---|---|
| Market | Pick several markets to compare side by side; listing-count range slider |
| Market Type | Six geographic types + listing-count range |
| Market Score Metrics | Range sliders per sub-score (e.g., 75–100) |
| Demand Drivers | OR-logic multi-select |
| Beds/Baths/Guests | — |
| Property Types | Entire / private / shared; Apartment, House, B&B, **Unique** (35 sub-types) |
| Amenities | Include **or exclude** (AC, parking, hot tub, pool, views, waterfront, ski-in…), to compare revenue with vs without |
| Price Tier | Budget / Economy / Midscale / Upscale / Luxury = equal-count quintiles of trailing-12-month ADR, per bedroom count |
| Review Rating | 4.0–5.0 |
| Professionally Managed | Yes/no + host portfolio size S/M/L |
| Price Variability | High/Med/Low (how often rates change on the calendar) |
| Listing Channel | Airbnb+Vrbo default; add Booking.com; "listed only on X" vs "any of" |

There is no global date-range picker in the base tiers: KPIs are fixed at the **last 12 months**, and charts show up to 3 years. A custom 2017–2025 range is Advanced-only (O [H-ADR][H-RVP][M-ADV]). Currency follows the country flag (O [H-NAV]).

### 2.4 Save / watchlist / compare
| Pattern | Where | Tag |
|---|---|---|
| Saved markets & submarkets ("saved lists") | Initials menu | O [H-NAV][M-SUB] |
| Saved for-sale properties | Initials menu | O [H-NAV] |
| Saved Rentalizer reports | Home | O [H-NAV] |
| Saved filter presets / custom regions | Filter row bookmark | O [H-FIL][H-DRAW] |
| Compare markets | Market filter multi-select → side-by-side list; Advanced = aggregate multi-market | O [H-FIL][M-ADV] |
| Compare vs benchmark | "+ Comparison" button; chips like "+15% vs LA 3BR" | O [H-PERF] |

---

## 3. Page templates

### 3.1 Country overview ("Find a Market") — O [H-MAP][H-MT][H-BND][H-YLD]
- **Header:** global filter row + save icon.
- **Map (expandable):** choropleth of markets. The metric dropdown offers **Market Score (default)**, Revenue Potential, Yield, Occupancy, Daily Rate, Listing Count, Property Rating, Location Score, Home Price. Each metric has its own hue (score = purple, 80–100 dark / 51–79 light / ≤50 pink; ADR = yellow; yield = blue; home price = pink).
- **List:** ranked markets, sorted by Market Score with a dropdown to sort by Occupancy / Revenue Potential / Daily Rate.
- Tabs `markets | submarkets | for-sale-properties` (O, URL params).

### 3.2 Market / Submarket Overview — O [H-NAV][H-BND][M-SUB][H-NEW][M-MI]
| Region | Content |
|---|---|
| Header | Market name, "All Submarkets" switcher, save |
| KPI strip | **Market Score** + LTM **Annual Revenue, Occupancy, ADR, RevPAR** |
| Score card | 5 sub-scores (below) |
| AI Overview | "instant highlights… key trends and… what guests are saying" (AI review summary) |
| Map + side table | Toggle **Submarkets ↔ Listings**. The heatmap metric is selectable. The side table lists submarket KPIs, listings or for-sale properties |
| Anchor tabs | Occupancy, Revenue, Rates, Seasonality |
The submarket page uses the same template ("just as comprehensive as any Market Overview") (O [M-SUB]).

**Market Score** (O [H-MS]): range 40–100. Letter bands A 90–100, B 75–90, C 65–75, D 50–65, F 40–50. Benchmarked only within the same country, with markets of ≥15 listings, weighted by listing count. Sub-scores:
| Sub-score | Definition (high = good) |
|---|---|
| Investability (US only) | Home cost vs average STR income of full-time rentals |
| Rental Demand | Annual occupancy + listing growth |
| Revenue Growth | YoY RevPAR for listings booked in both periods |
| Seasonality | % gap between min and max monthly revenue; high = **low** seasonality |
| Regulation | Inferred from host/property behavior; high = low or unenforced regulation |
⚠ Public SEO pages and the legacy blog say "0–100", which contradicts the help center (O [M-TMS][B-LEG]).

### 3.3 Metric sections (Occupancy / Revenue / Rates / Seasonality / Listings)
| Section | Charts & metrics | Tag / src |
|---|---|---|
| Revenue | Monthly avg revenue per **booked** listing; percentile bands (25/50/75/90); historic total market revenue; CSV export per chart | O [H-REV][H-DL]; percentiles O-legacy [B-LEG] |
| Occupancy | Booked ÷ available nights; active listing nights; Days Available | O [H-OCC] |
| Rates | ADR incl. cleaning fee, excl. service fee; ADR vs booked-supply overlay; box-and-whisker quartiles; **"What are guests willing to pay for future days?"** daily 6-month view; booking-trends chart (bookings made in last 7/30/60 days/all) = **Pacing** | O [H-ADR][H-FUT]; charts O-legacy [B-LEG] |
| Seasonality | **Daily RevPAR calendar heatmap** (light→dark blue) + monthly RevPAR over 3 years; booking lead-time pie | O [H-RVP]; pie O-legacy [B-LEG] |
| Listings | Total Active Listings (≥1 booking last month), channel-mix pie (Airbnb only / Vrbo only / multi-channel), Top 5 Property Managers + "View All" | O [H-ACT][H-SRC][H-PM] |
Data freshness differs by metric: rates, comp sets and future demand update **daily**; Occ/ADR/Revenue update **weekly**; Rentalizer, listings and scores update **monthly** (O [H-UPD]).

### 3.4 Short-term Rentals (listing explorer) — O [H-NAV][H-MAP]
- **Map + tile grid that stay in sync**: zooming the map filters the tiles.
- Map pins are **"property pills"** that show the chosen metric value, coloured by percentile (dark = best).
- Sort by Revenue / Occupancy / ADR / Review count. The total count sits under the filters.
- **Listing modal** (opens from a pill or tile): LTM performance summary, forward calendar, amenities, top competitors, and outbound links to Airbnb/Vrbo/Booking. Per-listing metrics include **Revenue Potential** (blocked days re-filled using comps) and Days Available (O [H-RP][H-CS]).

### 3.5 Rentalizer report — O [H-RZ][H-CSS][H-AGT][M-AGT]
| Region | Content |
|---|---|
| Input bar | Address or coordinates; bed/bath/guest dropdowns to correct defaults |
| Right KPI panel | Projected Revenue, Occupancy, ADR for the next 12 months (assumes 365 available days) |
| Confidence | **Comp Set Strength** Low/Med/High (revenue variance of the comps) |
| Distribution | Comp revenue-range histogram (shows outliers to remove) |
| Comps | Map ↔ List toggle; "Edit Comps" → Comp Sets screen → "Update Report" |
| Investment calculator | "Customize Estimate": opex, start-up costs, purchase price → NOI, **cap rate** |
| Charts | Monthly projection with a range band; **historical projection** chart ("what this search would have said" over 2 years); CSV export |
| Comparable Amenities | Which amenities are must-haves among the comps |
| Export | PDF (unlimited) |
| Agent layer | Similarity-scored comps with a "why similar" note, guest personas, amenity recommendations, events with impact score, host-competitiveness index (% pro-managed, % dynamic pricing, supply within 0.5 mi, avg rating), regulation card (approval status + risk level, jurisdiction, STR definition, new permits, trend, HOA) and an explicit **"not legal advice"** disclaimer |

### 3.6 For-Sale Properties — O [H-FS][H-YLD][H-ZON]
- Map coloured by **Yield = Revenue Potential ÷ list price**, with a dropdown to switch metric.
- Tiles show projected 12-month revenue and yield.
- Filters: yield, beds/baths, price, sq ft, days on market, STR zoning.
- Clicking a property opens a Rentalizer report + **Zone Details**: permitted yes/no/"Unknown", zone code (partner Zoneomics), broker contact, and a link to the full MLS listing.

### 3.7 Comp Sets dashboard — O [H-CS][H-CSM]
- Table of saved sets with a ⋯ menu (edit, rename, delete) and Actions → "Run Rentalizer" / "Performance".
- **Builder:** "My Comps" summary (count, average Revenue/Occ/ADR) above "Available Comps" (+ to add), with a map (pink = available, blue = selected) and filter groups Core Attributes / Performance / Amenities.
- **Performance view:** LTM KPI tiles + monthly line chart with tabs Revenue / Daily Rate / Occupancy / RevPAR / Active Listing Count, plus Export.

### 3.8 My Performance (host) — O [H-PERF][H-PS]
Collapsible stacked sections, each with View/Hide: **My Snapshot** (a plain-English read of the last 30 and next 30 days) → **Comparisons** (vs market, PMs, comp sets) → **Pacing** (vs last year, back and forward) → **Bookings**. Each section has a Summary tab plus metric tabs (Revenue, Occupancy, RevPAR, Length of Stay). The page publishes **like-for-like metric definitions** (fees in/out).

### 3.9 Account / settings — O [H-NAV][H-INV][H-CAN]
Initials menu → Profile, Subscription & Billing (Stripe portal, invoices, Cancel Subscription: access runs to the end of the term; cancel ≥2 days before renewal), saved items, connected listings/PMS, Help chat.

### 3.10 Empty / locked states
| State | Evidence | Tag |
|---|---|---|
| Free tier sees "Limited" Market Insights / Rentalizer | Pricing cards | O [M-PRC] |
| CSV export hidden or locked on Free | "not available for free subscription" | O [H-DL] |
| Comp metrics masked until paid | "With a paid subscription, you'll be able to see all of the performance metrics and save…" | O [H-CS] |
| Comp analysis needs ≥5 properties | Minimum-count guard | O [H-CSM] |
| Zoning "Unknown if zone permits STRs" | Explicit unknown state | O [H-ZON] |
| My Performance before connecting | Guided connect flow (Airbnb or PMS), "connecting is completely safe" reassurance | O [H-PERF] |
| Visual treatment of locks (blur, lock icon, upsell modal) | Not documented publicly | **UNKNOWN** |

---

## 4. Public SEO surface & funnel

| Surface | What it shows | Hand-off into the app | Tag |
|---|---|---|---|
| Home "Trending markets" carousel | Rank, Score, RevPAR YoY, Listings, Supply YoY, **"Hotness"** index | `/data/us/{id}/overview?cta=home-trending-market` | O [M-HOME] |
| Home "Top Performing STR Listings" | Channel, short title, market, Revenue Potential, Occ, Daily Rate | `/top-listings?listing_id=…&cta=home-top-listing` | O [M-HOME] |
| **Best Places to Invest** (annual report) | Top 10 by the **BPTI Score** (demand, revenue, investability, using real for-sale inventory; strict-regulation markets excluded). Breakouts by **budget band** (100–250k … 1–5M) and **demand driver**, ranked by yield | Each market links to its app overview (`?cta=home-bpti-market`) | O [M-BPTI][M-HOME] |
| **Top Markets by State** (`/us/top-markets-by-state/{state}`) | Editorial page per state: a primer on Market Score and markets vs submarkets, a ranked list with Score + Avg Annual Revenue + blurb, and the caveat "This is sample data – view real-time figures inside the AirDNA platform." | CTA into the app | O [M-TMS] |
| Feature landing pages (Submarket Insights, Custom Comp Sets, Listing Performance, Rentalizer Agent with an inline address form) | Each one is "How it works" in three steps + a long FAQ (SEO keywords) + CTA | `app.airdna.co/data/us?welcome=true` / `?tab=submarkets` | O [M-SUB][M-LP][M-AGT] |
| Free tools | Revenue Calculator, STR Tax Calculator, World Cup 2026 data and calculator, Glossary, Outlook report, Investor Survey, Podcast | Calculator → Rentalizer | O [M-PRC nav] |
| Product-led entry | "Start for Free" / "I Just Want to Browse" → app without a card; Free plan is "free forever", no trial | — | O [M-PRC][M-HOME] |

Old public app pages (`airdna.co/vacation-rental-data/app/...`) no longer appear in the site's links. `/vacation-rental-data` is now a marketing page (O [M-MI]). Whether any app page is crawlable without login is **UNKNOWN** (I: likely not, since routes use opaque IDs).

---

## 5. UX patterns worth learning (→ One Invest)

| Pattern | AirDNA evidence | Take-away for One Invest (I) |
|---|---|---|
| **Score + 5 explainable sub-scores, ranked within country** | [H-MS] | Build a "Điểm thị trường" for HN phường with sub-scores (demand, growth, seasonality, regulation, yield). Benchmark only within VN, set a min-listings threshold, and publish the formula |
| **One metric selector drives map, pills and lists** | [H-MAP] | A single dropdown, with a distinct hue per metric so the user can tell which metric the map is showing |
| **Map ↔ list sync** (zoom filters the tiles) | [H-MAP] | Core of `/vn/hanoi` listing explorer |
| **Global filter row + saved presets + drawn regions as filters** | [H-FIL][H-DRAW] | Filters persist across all sections. A drawn polygon behaves like any other filter |
| **Address → instant projection with a confidence score + histogram** | [H-RZ][H-CSS] | Show Comp Set Strength-style confidence. It is important for thin VN data |
| **Historical-projection chart** ("what we'd have said") | [H-RZ] | Builds trust in the model |
| **Explicit metric definitions** (fees in/out, active listing, LTM) | [H-ADR][H-OCC][H-ACT][H-PERF] | Publish a glossary in Vietnamese and link it from every KPI tooltip |
| **Per-metric freshness disclosure** | [H-UPD] | Show an "updated" stamp per block |
| **Explicit unknown + legal disclaimer** | [H-ZON][H-AGT] | Regulation card with an "Unknown" state; not legal advice |
| **SEO editorial → deep link with `cta=` attribution** | [M-HOME][M-BPTI] | Public `/vn/...` pages carry a sample or teaser and link into gated detail with UTM-style tags |
| **Budget-band and demand-driver breakouts** | [M-BPTI] | VN investors think in tỷ VND bands; drivers such as Old Quarter, West Lake, airport, universities |
| **Progressive disclosure** (Overview KPI → anchor tabs → charts → listing modal) | [H-NAV][H-MAP] | Same 3-level depth |
| **Collapsible plain-English snapshot first** | [H-PERF] | An AI or rule-based summary above the charts |

**Anti-patterns / risks**
- Market Score range is documented inconsistently (40–100 vs 0–100) (O). Pick one scale and keep it everywhere.
- Plan names drift (Pro/Advanced → Research/Host/PM/Advanced; Host is missing from the pricing table) (O [M-PRC]). Confusing tiers hurt conversion (I).
- Only the LTM window is shown and there is no date picker below Advanced (O). Investors can't check the post-COVID or seasonal story themselves (I).
- Opaque IDs in URLs (O) give no shareable or SEO-friendly paths. One Invest already uses diacritic-free slugs, so keep them.
- Mobile map reported "unusable" (competitor review, biased) [T-BNB].
- Revenue averaged over **booked** listings only (O [H-REV]) inflates "average revenue". Label the denominator.
- AI regulation output relies on third-party data plus AI and carries a disclaimer (O). Show sources per claim.

---

## 6. Unknowns (not verifiable without sign-in)
1. Visual paywall treatment (blur, lock, modal copy) and exactly which charts Free sees.
2. Contents of the "Advanced Solutions" pricing toggle and the Host and Advanced prices (third-party figures conflict).
3. Exact tab order and labels in the current market left nav: "Listings" vs "Short-term Rentals" naming overlap.
4. Whether markets can be compared side by side in charts below Advanced (the Market filter allows a multi-select list only).
5. How the "Hotness" index on the home page is calculated.
6. Whether Supply/Demand has a dedicated tab after the redesign (the home page cites "Supply growth").
7. Mobile app or responsive behavior.

---

## 7. Sources
**Help center (help.airdna.co/en/articles/…)**
H-NAV 11954306-navigating-the-new-airdna-market-explorer-platform · H-FIL 8062163-how-to-apply-filters-in-airdna · H-MAP 8062191-how-do-i-use-the-map-in-airdna · H-DRAW 14049662-how-to-use-the-draw-on-map-tool · H-MS 8062174-how-is-market-score-calculated · H-MT 8894551-how-does-airdna-define-its-market-types · H-BND 9344843-airdna-mapping-market-boundaries · H-DL 8062155-where-can-i-download-data-in-airdna · H-RZ 10559022-rentalizer-revenue-calculator · H-CS 11072044-comp-sets · H-CSM 11114494-comp-set-management-and-analysis · H-CSS 10552033-how-is-comp-set-strength-calculated · H-FS 8473582-for-sale-properties-in-airdna · H-YLD 13891063-what-is-yield · H-RP 8958225-what-is-revenue-potential · H-ZON 9047364-short-term-rental-zoning-data · H-FUT 8062184-how-do-i-analyze-future-bookings-with-airdna · H-PM 8062185-how-do-i-learn-about-property-managers-in-a-market · H-ACT 8380352-total-active-listings · H-UPD 8062172-how-often-is-airdna-s-data-updated · H-ADR 8062173-how-does-airdna-calculate-average-daily-rate-adr · H-OCC 8062178-how-does-airdna-calculate-occupancy-rate · H-RVP 8062179-what-is-revpar · H-REV 8374548-how-does-airdna-calculate-revenue · H-AGT 16189073-rentalizer-agent-what-it-is-and-how-it-works · H-PERF 16975794-my-performance-page-what-it-is-and-how-it-works · H-PS 9939158-what-is-performance-score · H-SRC 15480669-where-is-our-data-sourced-from · H-NEW 15382122-introducing-airdna-s-new-market-research-tools-for-short-term-rentals · H-INV 12588848-where-can-i-find-my-invoice-and-payment-history · H-CAN 8062200-how-do-i-cancel-my-subscription

**Marketing (www.airdna.co/…)**
M-PRC /pricing · M-HOME / · M-MI /vacation-rental-data · M-SUB /submarket-insight · M-ADV /advanced-tier · M-AGT /airbnb-calculator/analyzer · M-LP /airbnb-listing-performance · M-BPTI /best-places-to-invest-in-vacation-rentals · M-TMS /us/top-markets-by-state and /us/top-markets-by-state/arkansas · B-LEG /blog/airbnb-data-how-to-earn-more-with-airdna (pre-redesign; "80,000 markets")

**Third-party (treat as unverified)**
T-WEAR https://thewearify.com/airdna-free/ · T-BNB https://www.bnbcalc.com/reviews/airdna-review-2026 (competitor, biased)
