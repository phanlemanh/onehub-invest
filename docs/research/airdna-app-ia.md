# AirDNA: how the website and app are organised (UX research)

Date: 2026-10-18. Read-only browsing in the built-in browser at a 1440x900 desktop viewport. Claude in Chrome was not connected.
**Signed in: NO.** The app at `app.airdna.co` sends visitors who are not signed in straight to a "Create your free account" form. Nothing was signed into or submitted.

**How I saw the app without signing in:** AirDNA's own Help Center (`help.airdna.co`) has full-screen screenshots of the current app plus step-by-step guides. The sign-up page also shows a picture of the dashboard behind its form. Every item below carries one of these tags:

- **OBS-LIVE**: I saw it on a live page.
- **OBS-SHOT**: I saw it in an official screenshot of the app (Help Center, or the dashboard picture behind the sign-up form). It is the real UI, but I could not click it.
- **DOC**: the Help Center text says so, but I did not see it.
- **INFERRED**: my guess.

No market numbers were copied. Only names, labels and layout are recorded.

Screenshots: ảnh chụp tham chiếu chỉ lưu cục bộ (không commit — có ảnh lộ thông tin tài khoản). Some show the sample numbers that appear in AirDNA's own help screenshots. They are for layout reference only.

---

## 1. Sitemap and URL patterns

```
www.airdna.co                                    OBS-LIVE
├─ /                                  home (hero search with STR Research | Dynamic Pricing tabs)
├─ /pricing                           tabs: Hosts & PMs | Advanced Solutions
├─ /vacation-rental-data              "Research Markets" marketing page
├─ /airbnb-calculator                 public Rentalizer entry (address input → app)
├─ /airbnb-for-sale, /airbnb-listing-performance, /custom-comp-sets,
│  /submarket-insight, /custom-search-filters, /adapt, /short-term-rental-comps,
│  /owner-contact-details             feature pages (one per mega-menu item)
├─ /property-manager, /advanced-tier, /dmo-tourism-insights, /real-estate   Enterprise
├─ /us/top-markets-by-state           A–Z state picker
│  └─ /us/top-markets-by-state/{state}   ranked market cards → "Explore X" → app
├─ /best-places-to-invest-in-vacation-rentals, /outlook-report, /glossary, /blog/...
└─ /watch-demo, /contact, /about, /press

app.airdna.co                                    (behind sign-up)
├─ /data/login                        Log in (OBS-LIVE link)
├─ /data/us?welcome=true              "Start for Free" target (OBS-LIVE link)
├─ /data/{country}                    country overview = "Find a Market" (OBS-LIVE link /data/us)
├─ /data/{country}/airdna-{marketId}  market page (OBS-LIVE links from the state pages, e.g. airdna-26)
├─ …/{submarket}, /rentalizer, /comps, /performance, /for-sale   INFERRED (not visible)
auth.airdna.co/oauth2/register?…state={"path":"/data/us"}   sign-up wall; keeps the page you asked for (OBS-LIVE)
help.airdna.co/en/collections|articles/{id}-{slug}          Help Center (OBS-LIVE)
```

URL rules: the country code is the first level and the market ID (`airdna-{n}`) is the second (OBS-LIVE). Market IDs are opaque numbers, not readable place names.

---

## 2. Public site (OBS-LIVE)

### 2.1 Global header
- Thin purple **announcement bar** across the top: an AirDNA Adapt promotion with an arrow link.
- Header, left to right:
  - logo
  - **Solutions**, **Features**, **Enterprise**, **Resources**, **Pricing**, **Contact Us**
  - **Start for Free** (filled, primary) and **Watch a Demo** (outlined)
  - **Log in**
  - language picker (EN with a flag)
- Mega-menus open on hover. Each is a white panel the width of the page: link groups on the left, a grey **Quick Links** column on the right, and a **Start for Free** button in that column.
  - **Solutions** (each link has an icon and a one-line description): Calculate Revenue · Research Markets · Find For Sale Properties · Compare My Listing. Quick Links: Best Places To Invest, 2026 Outlook Report, STR Investment Guide, STR Glossary, STR Data Lab Podcast.
  - **Features**: STR Revenue Calculator · Custom Comp Sets · Submarket Insights · Custom Search Filters · Rate Recommendations · Performance Benchmarking · Competitor Comparison · Owner Contact Details.
  - **Enterprise Solutions**: Property Management · Property-level performance data · Tourism Insights · Real Estate Investment Analytics.
  - **Resources**, in three groups:
    - Investing Resources: Best Places to Invest, STR Investment Guide, How to Finance, 2026 Outlook Report, 2026 Investor Survey, Top Markets by State
    - Free Tools: Revenue Calculator, STR Tax Calculator, World Cup STR Data, World Cup Revenue Calculator
    - Hosting Resources: How to Start, Glossary, Rental Arbitrage, Best Property Managers, Insurance, Managing Remotely
- A chat widget sits in the bottom-right corner with an auto-popped greeting bubble.
- **No cookie banner appeared** in this session, so there was nothing to decline.

### 2.2 Home page
- Left: the headline, then a **search card** with two tabs (**STR Research** | **Dynamic Pricing**), a single location input ("Search any city, neighborhood, or address") and a text link **"I Just Want to Browse →"**.
- Right: an illustrated map with floating score badges labelled **Okay / Great / Excellent**. This is how the market score idea is introduced on the marketing site.
- Below: a "Data trusted by" logo strip.

### 2.3 Pricing (`/pricing`)
- Controls: a segmented tab **Hosts & PMs | Advanced Solutions**, and a **Monthly / Annual** toggle with a "Save X%" label.
- Hosts & PMs has four cards:
  - **Free**: Limited Rentalizer, Limited Market Insights, Browse For Sale Properties.
  - **Market Research** (badge "GREAT VALUE"): everything in Free, plus Customizable Rentalizer, Historical Market Insights, Comparable Sets, Future Demand Data, Property Performance, Top Markets and Properties, and a monthly allowance of Rentalizer Agent reports.
  - **Adapt Dynamic Pricing** (badge "NEW", priced per listing, with a free trial): AI Revenue Copilot, self-adjusting prices, integrations, performance tracking.
  - **Property Manager** ("Let's Talk"): Identify New Leads, Benchmark Against Competitors, Prove Your Performance, Expand to New Markets, Track Reviews & Policies, Professional Revenue Forecasts, more Agent reports.
- The FAQ also names a **Host** tier with benchmarking, a competitor rate calendar and Uplisting. That tier has no card, so the FAQ and the cards disagree.
- Advanced Solutions has four sales-led cards, each with "Best for…", **Contact Sales** and **Learn more**: Property Performance Data · Destination & Tourism Solutions · APIs & Integrations · Global Industry Insights. A "Schedule a Chat" call to action closes the tab.
- From the FAQ, what each tier adds:
  - **Free**: key metrics for every market worldwide.
  - **Paid**: history, custom comp sets, future demand and benchmarking.
  - **CSV export**: not available on Free (also stated in DOC).

### 2.4 Public market pages
- `/us/top-markets-by-state/{state}` is an editorial page:
  - "What Is AirDNA's Market Score?", "Markets vs. Submarkets"
  - a **sample-data overview card**, captioned "This is sample data – view real-time data in the AirDNA platform"
  - a ranked list of markets, each with name, **Market Score**, a short write-up and an **Explore {market}** button that deep-links into the app
  - a for-sale call to action, then a sticky **Quick Navigation** sidebar
- The index page has an A–Z letter strip for picking a state.
- **Pattern worth noting:** SEO content teases one number (the score) and pushes every deeper look into the app.

---

## 3. App shell, current design (OBS-SHOT from Help Center; DOC)

```
┌────┬────────────┬──────────────────────────────────────────────────────────────┐
│ ≡  │ AIRDNA     │ [Search market, submarket, or address  (●)]   ?Help 📣 🇺🇸 $USD (DH)│ ← top bar
├────┼────────────┼──────────────────────────────────────────────────────────────┤
│Home│ Find a Market        (secondary nav, shown when Research is active)        │
│Rsrch│ Market Insights ▾                                                         │
│Adapt│ Short-term Rentals                                                        │
│Pricing│ For Sale Properties                                                     │
│Perf.│ Rentalizer  [New]                                                         │
│Comps│ Host Tools ▾   (Uplisting ↗)                                              │
│    │ Find a Lender                                                             │
└────┴────────────┴──────────────────────────────────────────────────────────────┘
```

- **Icon rail** (far left, icon with a tiny label underneath): Home · Research · Adapt Pricing · Performance (only after listings are connected) · Comps. The active item gets a purple filled square.
- **Secondary nav** (only under Research): Find a Market · Market Insights (expands to sub-tabs) · Short-term Rentals · For Sale Properties · Rentalizer (with a "New" pill) · Host Tools ▾ · Uplisting (external-link icon) · Find a Lender.
- **Top bar**, left to right:
  - one search box covering markets, submarkets and addresses
  - **Help**, which opens Intercom chat
  - a megaphone icon for product news
  - a **country flag**, which opens a searchable country list (OBS-SHOT)
  - a **currency pill** ($USD)
  - an **initials avatar**
- **Avatar menu** (OBS-SHOT, DOC):
  - Personal Info
  - Saved Items ▾: saved markets, submarkets and for-sale properties
  - Enterprise ▾
  - subscription details
  - connected listings / PMS (Airbnb, Guesty, Hostaway, Uplisting, OwnerRez)
- **Older design** (OBS-SHOT, the picture behind the sign-up form):
  - a top nav with no sidebar: logo · [Markets ▾ dropdown + "Enter a city, state, or zip code"] · Subscribe · Explore · Host Tools · Enterprise · Learn · avatar
  - a second bar holding a breadcrumb ("United States"), filter chips, a "For Sale" toggle and **Quick Actions ▾**
  - this shows AirDNA moved from top tabs to a left rail plus secondary nav

### 3.1 Home (OBS-SHOT)
1. A hero band headed "Discover short-term rental market insights" with a large search box and an illustration.
2. **Continue your market search**: a carousel of market cards with arrow controls. Each card has a photo with a heart, a score ring, the name and market type (e.g. "Urban Metro"), three small metrics (**Revenue Potential · Occupancy · Daily Rate**) and the footer "Over the last 12 months".
3. A promo row: "Get insights on your bookings" → **Use Host Tools**.
4. A promo row: "Need financing…" → **Find A Lender**.

DOC: Home also lists saved Rentalizer reports and top investment markets.

---

## 4. Find a Market: country overview (OBS-SHOT)

- **Header:** a flag with the country name and a ▾ to switch country. **Share** sits top right.
- **Filter bar:** dropdown chips Market ▾ · Beds/Baths ▾ · Property Types ▾ · Amenities ▾ · Price Tier ▾ · Rating ▾, then **All Filters** (sliders icon), then a **Save** bookmark that stores a named filter set.
- **Layout:** a 60/40 split.
  - **Left:** a **Markets | Submarkets** toggle, a count ("N markets shown") and a sort dropdown (Market Score / Occupancy / Revenue Potential / Daily Rate). Below is a **three-column card grid** using the Home card layout.
  - **Right:** a full-height **choropleth map**. Its top-left has a metric dropdown (default Market Score) and a legend with four bins. Its left edge has map controls: Reset, **Draw**, + / −, and expand.
- **Heatmap metrics** (DOC): Market Score, Revenue Potential, Yield, Occupancy, Daily Rate, Listing Count, Property Rating, Location Score, Home Price.
- **Filters in full** (DOC):
  - **Market:** pick markets to compare, listing-count range.
  - **Market Type:** Coastal, Mountains/Lakes, Suburban, Urban/Metro, Mid-sized city, Small city/Rural.
  - **Market Score Metrics:** range sliders for Investability (US), Rental Demand, Revenue Growth, Seasonality, Regulation.
  - **Demand Drivers** (US, OR logic): golf, beach, ski, national parks, universities, and so on.
  - **Beds/Baths/Guests.**
  - **Property Types:** entire / private / shared; Apartment, House, B&B, Unique (about 35 subtypes).
  - **Amenities:** include or exclude AC, parking, hot tub, pool; also view, waterfront, ski-in/ski-out, beach access.
  - **Price Tier:** Budget, Economy, Midscale, Upscale, Luxury. These are ADR quintiles within each bedroom count.
  - **Review Rating:** 4.0–5.0.
  - **Professionally Managed**, plus host portfolio size S/M/L.
  - **Price Variability:** High/Med/Low.
  - **Listing Channel:** Airbnb, Vrbo, Booking.com. Airbnb + Vrbo is the default.
  - **Custom drawn region:** appears as a removable filter chip.
- **Filter rule:** every filter applies to the whole page.

---

## 5. Market page: "Market Insights" (OBS-SHOT; DOC)

```
← Market Overview: {Market}  >  All Submarkets ▾                 ⤴ Share   ♡ Save
[Beds/Baths▾][Property Types▾][Amenities▾][Price Tier▾][Rating▾][All Filters][🔖Save]
Overview | Listings | Occupancy | Revenue | Rates | Seasonality | Top Submarkets | Top Property Managers
┌ Market Score card ───────────┬─ KPI 2×2 ──────────────────────────────┐
│ "How is this market          │ Annual Revenue      │ Total Active Listings │
│  performing?"  ◯ ring score  │ Average Daily Rate  │ Occupancy Rate        │
│ 5 sub-score bars             │ (big value + YoY delta pill "past year") │
└──────────────────────────────┴────────────────────────────────────────┘
┌ Map (full width) ─ metric ▾ + legend ─ Reset/Draw ──┬ Floating panel ───────────┐
│ submarket choropleth                                 │ tabs: Submarkets|Listings|For Sale │
│                                                      │ "Top Submarkets  View all >"│
│                                                      │ rows: thumb, name, Score,   │
│                                                      │ Revenue, Occu., RevPAR, ADR │
└──────────────────────────────────────────────────────┴─────────────────────────────┘
```

- **Breadcrumb:** "All Submarkets ▾" opens a submarket picker, so you can drill down without leaving the page.
- **Sub-tab row:** these are anchor jumps to chart sections on one long page, not separate pages (DOC).
- **Market Score card:**
  - big ring gauge, scored 40–100. It maps to A–F grades (DOC) and to Okay / Great / Excellent on the marketing site.
  - five sub-score bars: **Investability** (US only), **Rental Demand**, **Revenue Growth**, **Seasonality**, **Regulation**. Each has a small number and an ⓘ tooltip.
- **KPI tiles:** last 12 months, a large value, a green or red YoY pill labelled "past year", and an ⓘ.
  - New design: Annual Revenue, Total Active Listings, Average Daily Rate, Occupancy Rate.
  - Older design: **RevPAR** instead of listings, and each tile has a **sparkline**.
- **Map side panel:** **Submarkets | Listings | For Sale** tabs, with a ">" control to collapse the panel.
- **Section names further down the page:**
  - **Listings:** total available listings, listings by rental channel, listings by rental size, top property managers table (OBS-SHOT, old design). The channel and size breakdowns are **donuts**.
  - **Occupancy, Revenue, Rates, RevPAR:** monthly line or bar charts, each with an **Export CSV** button top right on paid plans (DOC).
  - **Rates → future demand:** "What are guests willing to pay for future days?" (daily booked vs. available) and "When is Demand Highest?" (bookings by booking window: 7 / 30 / 60 days / all time). Both are **Pacing** charts covering the next 6 months (DOC).
  - **Seasonality.**
  - **Top Property Managers:** a table with name or host ID, average review, review count, property count and an external link. Not shown for submarkets (DOC).
- **AI Overviews** (DOC, newer): auto-written market highlights and a "what guests are saying" summary.

### 5.1 Short-term Rentals: the listings explorer (OBS-SHOT)
- Title: "Top Short-term Rentals: {Market} > All Submarkets ▾", plus the same filter bar.
- **Left:** "N Listings shown" and a sort dropdown (Revenue / Review Count / Occupancy / Daily Rate). Below is a **three-column grid of listing cards**:
  - a photo carousel with channel logo badges (Airbnb / Vrbo / Booking) and a "+ Add" button that puts the listing in a comp set
  - a row of bed, bath and guest icons, plus a rating with review count
  - the title and market
  - two **highlighted** metrics: Revenue Potential and Days Available
  - three base metrics: Revenue, Occupancy, Daily Rate
- **Right:** a map with a **Submarkets | Listings** toggle. Listings show as **price-label "pills"** coloured by the chosen metric (legend in four bins).
- **Map and list stay in sync** (DOC): zooming the map filters the card grid.
- **Clicking a pill or card** opens a **listing modal** (DOC):
  - 12-month performance summary
  - **forward calendar**
  - amenities
  - **top competitors**
  - links out to the OTA listing page
- **Hovering a dot** shows a small property card (DOC, Comps).

### 5.2 For Sale Properties (US only; OBS-SHOT)
- **Filter bar:** Beds/Baths · Yield · Property Types · Home Price · **Regulations** · Sq. Feet · Time on Market · All Filters · Save. Sort defaults to "Yield (High to Low)".
- **Cards:** photo carousel, heart, price, address, then **Yield % · Days on Market** and **Revenue · Occupancy · Daily Rate**.
- **Inline promo card** in the grid: "Looking to buy or sell? … Continue", which connects to agents.
- **Map:** coloured by Yield (four bins), with a Submarkets | For Sale toggle.
- **Clicking a card** opens a Rentalizer report for that address, plus broker and listing contact details (DOC).
- **STR zoning/regulation flag** shown on each property (DOC).

---

## 6. Rentalizer: from address to report (OBS-SHOT; DOC)

1. **Landing page, "Rentalizer Dashboard":**
   - a dismissible purple banner ("Introducing Rentalizer Agent…")
   - an **"Analyze Any Property's Short-Term Rental Potential"** card: address input, round arrow button, and the tip "save reports to track properties"
   - three illustrated feature cards: **Revenue Potential · Financial Calculator · Customizable Comp Sets**
2. **Report header:**
   - breadcrumb "← Rentalizer: {Market} > {Submarket}"
   - a Street View photo on the left
   - "Revenue potential for {address}"
   - inline **5 Bed ▾ · 5 Bath ▾ · 10 Guests ▾ · [Update]** dropdowns
   - a link to "…submarket >"
   - a **PDF** icon at the top
3. **Projection panel** (right side): **Projected Revenue · Occupancy · ADR** for the next 12 months, then the "Comp Revenue Range" chart (a histogram of comps by revenue band).
4. **Comparable Properties:**
   - **Comp Set Strength: Low / Medium / High**, shown as a five-segment meter with an ⓘ
   - **Edit Comps** button
   - **Map | List** toggle
   - table columns: Listing, Revenue, ADR, Occupancy, Bedrooms, Bathrooms, Accommodates, Days Available, Revenue Potential, and a trash icon
   - paginated ("1–9 of 10")
5. **Investment Return Calculator:**
   - "Customize Estimate" opens a **modal**
   - header KPIs: Operating Expenses · Net Operating Income · Cap Rate
   - input groups: Rental Revenue, Purchase Price, **Annual Operating Costs** (each as % and $: Management Fee, Lodging Tax, Property Tax…) and **Startup Costs** (Home Furnishings, Home Improvement, Closing Costs…)
   - buttons: Reset To Default, **Save Changes**
6. **Projected Revenue charts:** monthly revenue with a **range band**, and a historical "what this search would have returned" chart with a "Last 12 Months ▾" period picker. Both export to CSV.
7. **Comparable Amenities:**
   - a two-column list: amenity icon, name, % of comps that have it
   - amenities only some comps have are **highlighted orange**, with an inline **Edit comps** button
8. **Rentalizer Agent** (paid, counted per report), extra sections (DOC):
   - property dataset pulled from Zillow / Homes.com / Realtor
   - **New Comps** with a similarity score and a "how this is similar" note
   - Revenue Projection with seasonality
   - **Guest Insights**: likes, dislikes, guest types, recommended amenities
   - **Market**: demand-driver badges, **Top nearby events** with an impact score, seasonality, **Host competitiveness** (professionally managed %, dynamic pricing %, supply, average rating), **Booking Patterns**
   - **Regulations**: STR Approval Status with a Low–High risk level, Jurisdiction, STR Definition, and so on

---

## 7. Comps: comp sets (OBS-SHOT; DOC)

- **Dashboard:**
  - title "Comp Sets" and a **+ New Comp Set** button (dark, top right)
  - table: thumbnail, name, "Last updated", Count, and actions **Run Rentalizer** and **Performance**. Performance is greyed out when a set has fewer than 5 comps.
  - a ⋮ menu: edit, rename, delete
  - "Rows per page" control and pagination
- **Create flow:**
  - name the set
  - choose **Start with AirDNA Comps** (address plus bed/bath/guest count) or **Select Your Own Comps** (market or submarket)
- **Editor** (OBS-SHOT):
  - **left:** **My Comps** (collapsible) with summary KPIs (count of comps, projected revenue, occupancy, ADR, confidence score), a table with trash icons, then an **Available Comps** table with "+" buttons
  - **right:** a map with filter dropdowns (Core Attributes · Performance · Amenities). **Pink dots are available comps and blue dots are selected ones.**
  - a sticky **Update Report** button top right
- **Performance view:** KPIs for Average Revenue, ADR, Occupancy and RevPAR; a monthly line chart with metric tabs (Revenue / Daily Rate / Occupancy Rate / RevPAR / Active Listing Count); **Export**.

## 8. Performance: your own connected listings (OBS-SHOT; DOC)

- **Portfolio filter bar:** All Markets ▾ · All Bedrooms ▾ · All Listings ▾, a "Viewing X of Y listings" count, and **View all** with an expand icon.
- **Stacked sections**, each opened or closed with **View / Hide**. Each has an icon tile, a title with ⓘ, and a **one-sentence plain-English summary**:
  1. **My Snapshot:** two side-by-side panels for the last 30 days and the next 30 days. Each has My Revenue vs. Previous Year Revenue (big number plus a line chart), Adjusted Occupancy, and Actual / Future Avg. Nightly Rate.
  2. **Comparisons:** against the market, competing property managers and comp sets.
  3. **Pacing:** against last year, both looking back and looking ahead.
  4. **Bookings:** a list of recent reservations.

## 9. Adapt Pricing (OBS-SHOT)
- The rail item opens a marketing / **"Join the Waitlist"** page, so it is a gated feature.
- The preview shows a Rates chart (percentile band 25th–75th, comp median, booked or blocked bars), a calendar grid, and a "Recommended Strategy" card with an **AI Explanation**.

---

## 10. How things behave

| Pattern | Where | Tag |
|---|---|---|
| A filter bar shared by every Research page, filters apply page-wide, filter sets saved under a name (🔖) | all Research pages | OBS-SHOT + DOC |
| Draw a shape on the map; it becomes a filter chip you can save or redraw | any page with a map | DOC |
| 50/50 or 60/40 split of list/grid and map; zooming the map filters the list | Find a Market, STR, For Sale | OBS-SHOT + DOC |
| Map colour metric picked from a dropdown, with a 4-bin legend in one hue family (score purple, ADR yellow, price pink, yield blue) | all maps | DOC |
| Price-label pills on the map instead of plain dots | listings map | OBS-SHOT |
| Drill down Country → Market → Submarket (breadcrumb ▾) → Listing modal → OTA page | everywhere | OBS-SHOT + DOC |
| Hover a dot for a small card; click for a full listing modal | maps | DOC |
| Sub-tabs that jump down one long page | market page | DOC |
| One-sentence summaries written in plain English above the numbers | Performance, AI Overviews | OBS-SHOT + DOC |
| A confidence meter shown next to an estimate (Comp Set Strength) | Rentalizer, Comps | OBS-SHOT |
| Feature locked by plan: button greyed out (Performance below 5 comps), Export hidden on Free, Agent reports counted | Comps, charts | OBS-SHOT + DOC |
| Sign-up wall: blurred dashboard picture behind a "Create your free account" form; the page you asked for is kept for after sign-up | app entry | OBS-LIVE |
| Gated feature becomes a waitlist page | Adapt | OBS-SHOT |
| Promo cards placed inside the content grid (lender, buy/sell agent, Host Tools) | Home, For Sale | OBS-SHOT |
| Heart to save and Share, top right of each page | market and card level | OBS-SHOT |
| Loading states / skeletons | — | NOT SEEN |

## 11. How dense the screens are
- **Medium-high density, but calm.** The app is white with a very light lavender page background, and cards have 1px grey borders with no heavy shadows. One accent colour (indigo/purple) is used for the active nav item, the score ring and the map scale.
- **Type sizes:** KPI values about 28–32px bold, labels about 12px grey, with ⓘ next to almost every metric name.
- **Cards** show 5–6 numbers in a fixed grid. Two of them are "highlighted" in a shaded box, and a grey caption sits at the bottom ("Over the last 12 months").
- The **map takes about 40% of the width** on every Research page and stays visible. Lists scroll in their own column.
- **Navigation chrome is about 13% of the width** (an icon rail of about 50px plus a secondary nav of about 130px).
- **Marketing site:** generous white space, purple-gradient heroes, and a chat bubble that pops up on its own.

## 12. What I could not access
- **The live app with a session:** I could not click anything, see real loading or empty states, see the exact URLs for submarket, Rentalizer, Comps or Performance pages, or see how "Free plan" paywall teasers look in place.
- **Inside each market sub-tab:** the exact charts under Occupancy, Revenue, Rates and Seasonality are only described in text. I saw no screenshot.
- **Smart Rates** (legacy): no mention of it anywhere now. Adapt appears to have replaced it (INFERRED).
- **Watchlist and side-by-side compare:** there is no separate Compare screen. "Saved Items" in the avatar menu stands in for a watchlist. Comparing markets happens through the Market filter, which accepts several markets (DOC).
- **Vietnam or Hanoi market page:** I did not search for it. Coverage is stated as 120k+ markets worldwide (pricing FAQ).
- **App HTML or JS** (to read URL routes): blocked by a Cloudflare challenge. I did not try to get around it.
