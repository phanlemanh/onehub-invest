# pipeline/ — Transform & Metrics

## What This Does
Reads raw snapshots from `../collector/snapshots/` → validates → transforms → writes to PostgreSQL.

## Key Scripts

| Script | Purpose |
|--------|---------|
| import-airbnb.mjs | Import snapshots (verify sha256, write staging tables) |
| transform-airbnb.mjs | Staging → canonical (listings, nights, areas) |
| transform-zalo.mjs | Zalo posts → sale_offers, rent_lt_offers |
| transform-hcmc-simple.mjs | HCMC-specific (market-first, then phường assign) |
| transform-airdna.mjs | AirDNA XHR → airdna_markets, metrics, scores |
| reassign-areas.mjs | Point-in-polygon assign listings to phường |
| apply-polygons.mjs | Apply OSM boundary polygons to areas |
| finalize-hanoi.sh | Full pipeline: import → transform → metrics |

## SQL Files (execute in order)

| File | Purpose |
|------|---------|
| 300_metrics.sql | Build market_metrics from nights + listings |
| 400_breakdowns.sql | Precompute ADR by size, room type, top listings |
| 500_asset_stats.sql | Compute median prices + yield per phường |

## Database Schema (key tables)

```
areas (id, parent_id, region_type, name, geom)
listings (id, area_id, name, room_type, bedrooms, price_listed, lat, lng)
nights (listing_id, night, available, price)
market_metrics (area_id, month, listing_count, revenue, adr, occupancy, revpar)
sale_offers (offer_id, area_id, kind, price_vnd, area_m2, confidence)
market_asset_stats (area_id, kind, median_perm2, median_rent)
airdna_markets / airdna_scores / airdna_market_metrics
```

## Conventions
- **City-parametric**: most scripts accept city as arg (`node transform-airbnb.mjs hcmc`)
- **Staging → canonical**: raw data goes to stg_* tables first, then transforms to clean tables
- **Point-in-polygon**: listings assigned to phường by ST_Contains(coordinates, polygon)
- **Idempotent**: scripts can run multiple times without duplicating data (ON CONFLICT)

## Gotchas
1. **pg client**: uses `pipeline/node_modules/pg` (not app's), run `npm install` in pipeline/
2. **Docker psql**: `docker compose exec -T -e PGPASSWORD=oneinvest db psql -h localhost -U oneinvest -d oneinvest`
3. **Snapshot paths**: relative `../collector/snapshots/<city>/<snapshot-id>/`
4. **FK constraints**: delete child rows (nights, metrics) before parent rows (listings, areas)
