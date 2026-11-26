# onehub-data-api

Real estate data API for Vietnam — markets, listings, deals, asset statistics.

Built with [Hono](https://hono.dev) + TypeScript + PostgreSQL/PostGIS.

## Quick Start

### Option 1: Docker (recommended)

```bash
git clone https://github.com/phanlemanh/onehub-data-api.git
cd onehub-data-api
docker compose up -d
# API runs on http://localhost:3001
curl http://localhost:3001/health
```

### Option 2: Local development

```bash
git clone https://github.com/phanlemanh/onehub-data-api.git
cd onehub-data-api
npm install

# Start PostgreSQL with PostGIS (or use your own)
docker run -d --name onehub-db \
  -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=onehub \
  -p 5432:5432 postgis/postgis:16-3.4

# Apply schema migrations
# (copy migrations from onehub-invest-app repo or create your own)
psql $DATABASE_URL -f path/to/migrations/*.sql

# Seed sample data
psql $DATABASE_URL -f seed.sql

# Start API
npm run dev
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | *(see setup below)* | PostgreSQL connection string |
| `PORT` | `3001` | API port |
| `DATA_API_KEYS` | *(empty)* | Comma-separated API keys. Empty = no auth (dev mode) |
| `PUBLIC_URL` | *(empty)* | Public URL for OpenAPI servers list |

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/openapi.json` | OpenAPI 3.1 spec |
| GET | `/v1/markets` | List markets with Market Score |
| GET | `/v1/markets/:id` | Market detail with score breakdown |
| GET | `/v1/markets/:id/submarkets` | Submarkets with metrics |
| GET | `/v1/markets/:id/insights` | Monthly metrics (ADR, occupancy, revenue) |
| GET | `/v1/listings` | Filter listings (market, area, bedrooms) |
| GET | `/v1/listings/:id` | Listing detail with self-collected photos |
| GET | `/v1/deals` | Best-value listings (price/m² vs group median, with price rank) |
| GET | `/v1/asset-stats` | Asset statistics (median, p25, p75, yield) |
| GET | `/v1/coverage` | Self-collected listing count by market |

### Response fields

`GET /v1/deals` — each item: `offerId`, `priceVnd`, `areaM2`, `pricePerm2`, `bedrooms`, `phuong` (ward name),
`marketId`, `propertyType`, `medianPerm2`, `discountPct`, `confidence`, `firstSeen`, `lastSeen`, `nReposts`, and — when
the price-rank table is available — a `rank` block (`level`, `node`, `n`, `median`, `p20`, `percentile`, `label`,
`needsVerification`, `metric`, `bedroomsGroup`, `reason`). `meta`: `total`, `minDiscount`, and `kind` when ranked.

`GET /v1/coverage` — one row per Vietnamese market: `areaId`, `name`, `ourListings` (self-collected short-term rental
listings in the market, including its wards). Markets with no listings yet are included with `ourListings: 0`.

`GET /v1/listings/:id` — `id`, `name`, `roomType`, `propertyType`, `bedrooms`, `bathrooms`, `accommodates`,
`minimumNights`, `priceListed`, `lat`, `lng`, `area`, `market`, `photos`, `reviewCount`, `lastSeen`.
`photos` is `{ urls, source }`: `source` is `"self"` when the listing has self-collected photos, otherwise both
are `null`.

Data boundaries: this API never returns the text, images, group name or sender name of community posts, and never
reads or returns calibration-source data — those stay in the internal operations portal.

## Authentication

Set `DATA_API_KEYS` env with comma-separated keys:

```bash
DATA_API_KEYS=your-api-key-1,your-api-key-2
```

Then include in requests:

```bash
curl -H "Authorization: Bearer $YOUR_API_KEY" http://localhost:3001/v1/markets
# or
curl -H "X-API-Key: your-api-key" http://localhost:3001/v1/markets
```

If `DATA_API_KEYS` is empty, auth is disabled (development mode).

## Database Schema

This API reads from a PostgreSQL database with PostGIS. See [onehub-invest-app](https://github.com/phanlemanh/onehub-invest-app) for the full schema (20 migrations).

Key tables:
- `areas` — markets and submarkets with PostGIS polygons
- `listings` — property listings with photos, pricing, availability
- `nights` — nightly availability and pricing calendar
- `market_metrics` — monthly market-level metrics
- `market_asset_stats` — asset price statistics per area (median, quartiles)
- `sale_offers` — for-sale listings from community sources

## Self-Hosting

### Railway / Fly.io / Render

1. Create a PostgreSQL database with PostGIS extension
2. Set `DATABASE_URL` environment variable
3. Deploy this repo
4. Apply schema + seed data

### Docker

```bash
docker build -t onehub-data-api .
docker run -p 3001:3001 \
  -e DATABASE_URL=postgres://... \
  onehub-data-api
```

## License

[MIT](LICENSE)

## Related

- [onehub-invest-app](https://github.com/phanlemanh/onehub-invest-app) — Next.js frontend that consumes this API
