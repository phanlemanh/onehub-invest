# app/ — Next.js Dashboard

## Framework
- Next.js 16 App Router (force-dynamic on all pages)
- Recharts for charts (client components, "use client")
- MapLibre GL for maps (requires setWorkerUrl from lib/map-worker.ts)
- Tailwind CSS for styling

## Structure
```
app/src/
├── app/           # Routes (pages)
│   ├── vn/         # /vn (national overview)
│   ├── [country]/[market]/  # /vn/hanoi, /th/bangkok
│   ├── listing/[id]/        # /listing/abnb_xxx (drill-down)
│   └── login|saved/         # Auth + saved markets
├── components/    # React components (server + client)
└── lib/           # Queries, db pool, auth, format
```

## Key Files
- `lib/queries.ts` — ALL database queries (getKpis, getMetrics, getYieldRows, getAirdnaComparison...)
- `lib/db.ts` — pg Pool (max 5 connections)
- `lib/map-worker.ts` — MapLibre worker fix for Turbopack
- `lib/auth.ts` — Session management (scrypt + cookie)

## Currency
- Map: `currencyFor(areaId)` → "THB" | "VND"
- Format: `fmtMoney(value, currency)` → "₫109,162" or "THB 2,179"

## Routes
- `/vn` — National overview (AirDNA markets)
- `/vn/hanoi` — Hanoi insights (STR + AirDNA + yield)
- `/vn/hcmc` — HCMC insights
- `/th/bangkok` — Bangkok (Inside Airbnb data)
- `/listing/[id]` — Listing drill-down with calendar heatmap
- `/vn/hanoi/map` — Market Finder choropleth

## Don't
- Don't import from collector/ or pipeline/
- Don't add server actions for data collection
- Don't use MapLibre without setWorkerUrl (blank map bug)
- Don't cache pages (force-dynamic required for fresh data)
