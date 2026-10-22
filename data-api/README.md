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
| GET | `/v1/listings/:id` | Listing detail with photos and stats |
| GET | `/v1/deals` | Best-value listings (price/m² vs area median) |
| GET | `/v1/asset-stats` | Asset statistics (median, p25, p75, yield) |
| GET | `/v1/coverage` | Data coverage report by market |

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
