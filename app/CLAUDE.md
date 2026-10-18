# app/ — Next.js Dashboard

## ⚠️ MANDATORY: Design Rules
**READ FIRST**: `DESIGN_RULES.md` — Quy trình bắt buộc chọn component:
ReUI block → shadcn/ui → custom (LAST RESORT). Lập inventory mọi component.

## Framework
- Next.js 16 App Router (force-dynamic on all pages)
- Tailwind CSS v4 + shadcn/ui + ReUI Pro ($250/yr, 654 blocks)
- Recharts via ReUI chart blocks (not bare Recharts)
- MapLibre GL for maps (requires setWorkerUrl from lib/map-worker.ts)

## Structure
```
app/src/
├── app/              # Routes
│   ├── vn/           # /vn (national overview)
│   ├── [country]/[market]/  # /vn/hanoi, /th/bangkok
│   ├── listing/[id]/        # /listing/abnb_xxx
│   └── login|saved/         # Auth + saved markets
├── components/
│   ├── ui/           # shadcn base (button, card, dialog...)
│   ├── reui/         # ReUI installed blocks (charts, stats, grids)
│   ├── custom/       # Custom components (LAST RESORT, see DESIGN_RULES.md)
│   └── maps/         # MapLibre components (no ReUI equivalent)
└── lib/
    ├── queries.ts    # ALL database queries
    ├── db.ts         # pg Pool (max 5)
    ├── auth.ts       # Session (scrypt + cookie)
    ├── format.ts     # Currency/number formatting
    ├── map-worker.ts # MapLibre Turbopack fix
    └── utils.ts      # shadcn cn() utility
```

## ReUI Quick Reference
- Registry: `@reui` in `components.json`
- License: `REUI_LICENSE_KEY` in `.env.local` (NEVER commit)
- Install: `npx shadcn@latest add @reui/<block-name>`
- Import: `from "@/components/reui/<block-name>"`
- Full catalog: https://reui.io/blocks

## Key Files
- `lib/queries.ts` — ALL database queries (getKpis, getMetrics, getYieldRows, getAirdnaComparison...)
- `lib/map-worker.ts` — MapLibre worker fix (setWorkerUrl from public/)

## Currency
- Map: `currencyFor(areaId)` → "THB" | "VND"
- Format: `fmtMoney(value, currency)` → "₫109,162" or "THB 2,179"

## Routes
- `/vn` — National overview (AirDNA markets)
- `/vn/hanoi` — Hanoi insights (STR + AirDNA + yield)
- `/vn/hcmc` — HCMC insights
- `/th/bangkok` — Bangkok (Inside Airbnb data)
- `/listing/[id]` — Listing drill-down with calendar heatmap

## Don't
- **Don't create custom UI when ReUI block exists** (see DESIGN_RULES.md)
- Don't import from collector/ or pipeline/
- Don't use MapLibre without setWorkerUrl (blank map bug)
- Don't cache pages (force-dynamic required)
- Don't hardcode colors (use Tailwind CSS variables)
- Don't commit .env.local (contains REUI_LICENSE_KEY)
