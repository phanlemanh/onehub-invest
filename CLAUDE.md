# One Invest — Market Insights for Vietnam Real Estate

## Codebase Map

```
one-invest/
├── app/         # Next.js Dashboard (Vercel deploy root)
├── collector/   # Data collectors (Playwright, Mac Studio always-on)
├── pipeline/    # Transform scripts (Node.js + pg)
├── db/          # Migrations + docker-compose (PostgreSQL :5433)
├── docs/        # ADRs, specs, DATA-CONTRACT
├── scripts/     # setup.sh, migrate-export.sh
└── CLAUDE.md    ← You are here
```

## Data Flow (one direction only)

```
Sources (Zalo/Airbnb/AirDNA/OSM) → collector/ → raw snapshots →
pipeline/ (import + transform) → PostgreSQL → app/ (Dashboard)
```

**Never reverse**: app/ doesn't collect data, collector/ doesn't serve HTTP.

## Architecture Rules

1. **Raw data is IMMUTABLE** — collector writes snapshots, never modifies
2. **All interpretation in transform** — pipeline/ parses, validates, deduplicates
3. **DATA-CONTRACT.md is the interface** — changes require schemaVersion bump
4. **Modular monolith** — no microservices; all modules in this repo
5. **TypeScript strict everywhere** — type errors catch bugs early
6. **Portals** — mọi trang UI thuộc 1 cổng theo `docs/architecture/portals.md`:
   Invest Portal (`/vn/**` công khai, cho nhà đầu tư) và Ops Portal
   (`/ops/**` bắt buộc auth, cho vận hành dữ liệu/Agent Swarm). Trang mới
   phải khai báo cổng; không route nội bộ nào nằm ngoài `/ops`.

## Conventions

- **Language**: Vietnamese for domain logic comments, English for API/types
- **SQL files**: numbered by execution order (001_, 200_, 300_, 400_, 500_)
- **Naming**: `abnb_` prefix for Airbnb listings, `vn-hanoi-` for Hanoi phường areas
- **Commits**: Conventional Commits (feat:, fix:, docs:, refactor:)
- **Never commit**: .env*, snapshots/, .airdna-profile/, *.har, research-local/

## Verify Commands

```bash
# App builds + serves
cd app && npm run build && npm run start -- -p 3456
curl -sf http://localhost:3456/vn/hanoi  # must return 200

# Collector compiles + lists sources
cd collector && npm run build && npm run collect -- list-sources

# Pipeline can connect to DB
cd pipeline && node -e "import('pg').then(async ({default:pg}) => {
  const c = new pg.Client({connectionString: 'postgres://oneinvest:oneinvest@localhost:5433/oneinvest'});
  await c.connect(); console.log('DB OK:', await c.query('SELECT count(*) FROM market_metrics'));
  await c.end();
})"

# Full setup from scratch
bash scripts/setup.sh
```

## Environment

- **PostgreSQL**: localhost:5433 (Docker, kartoza/postgis:17-3.5, user=oneinvest, pass=oneinvest, db=oneinvest)
- **Next.js**: localhost:3456
- **Node.js**: 24+ (check .nvmrc)
- **DATABASE_URL**: `postgres://oneinvest:oneinvest@localhost:5433/oneinvest`
- **AirDNA Chrome profile**: `.airdna-profile/` (persistent login, never commit)

## Key Technical Gotchas

1. **MapLibre + Turbopack**: requires `setWorkerUrl("/maplibre-gl-worker.mjs")` from `public/` (see `app/src/lib/map-worker.ts`)
2. **Airbnb search**: headful Chrome only (headless gets anti-bot). Pagination uses `A[aria-label^='Trang N']` links, NOT `pagination-next-button` testid
3. **AirDNA API**: `out geom` (NOT `out tags geom`) for OSM boundaries; UA header required
4. **Vietnamese slugs**: all URL slugs strip diacritics (đ→d, ố→o). Use `slugifyName()` in queries.ts
5. **Market rollup**: `300_metrics.sql` DELETEs market-level rows before INSERT to avoid `ON CONFLICT DO NOTHING` keeping stale data

## Common Tasks

| Task | Command |
|------|---------|
| Run dashboard locally | `cd app && npm run start -- -p 3456` |
| Collect Airbnb data (Hanoi) | `cd collector && npm run collect -- collect --city hanoi --source airbnb-discovery` |
| Collect AirDNA data | `cd collector && npm run collect -- collect --city hanoi --source airdna-research` |
| Import + transform + metrics | `cd pipeline && bash finalize-hanoi.sh` |
| Backup for migration | `bash scripts/migrate-export.sh` |
| Setup on new machine | `bash scripts/setup.sh` |

## Data Sources

| Source | Collector | What it provides |
|--------|-----------|-----------------|
| Airbnb (airbnb.com.vn) | airbnb-discovery, airbnb-listing | Listings, calendar, prices (VND) |
| AirDNA ($249/yr) | airdna-research | Market scores, LTM metrics, VN-wide coverage |
| OSM | osm-boundaries | Phường/province polygons |
| Zalo groups (future) | zalo-groups (G4) | Sale/rent listings from broker posts |

## Don't

- Don't scrape AirDNA data into the product (calibration reference only per ToS)
- Don't use headless Chrome for Airbnb (anti-bot detection)
- Don't commit .airdna-profile/ (contains login cookies)
- Don't modify raw snapshots (immutable by design)
- Don't add fields to DATA-CONTRACT without bumping schemaVersion
