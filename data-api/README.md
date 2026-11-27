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
| `DATA_API_KEYS` | *(empty)* | Comma-separated API keys. **Required** outside `NODE_ENV=development` / `NODE_ENV=test` — see [Authentication](#authentication) |
| `PUBLIC_URL` | *(empty)* | Public URL for OpenAPI servers list |

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/openapi.json` | OpenAPI 3.1 spec |
| GET | `/v1/markets` | List markets — id, name, country, listing count (most listings first) |
| GET | `/v1/markets/:id` | One market — same four fields |
| GET | `/v1/markets/:id/submarkets` | Submarkets — id, name, listing count (by name) |
| GET | `/v1/markets/:id/insights` | **Removed** — `410 GONE` (no self-collected monthly series with enough coverage yet) |
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

`GET /v1/markets`, `GET /v1/markets/:id` — `id`, `name`, `countryCode`, `listingCount` (self-collected short-term rental
listings, wards included); the list is ordered by `listingCount` then name, `meta`: `total`, `limit`.
`GET /v1/markets/:id/submarkets` — `id`, `name`, `listingCount`, ordered by name; `meta`: `total`.

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

The API is **closed by default** when no keys are set:

| Environment | `DATA_API_KEYS` empty |
|---|---|
| `NODE_ENV=development` or `NODE_ENV=test`, not on Vercel | No auth (local development and tests). `npm run dev` sets `NODE_ENV=development` for you. |
| Anything else — `NODE_ENV=production`, `NODE_ENV` unset, any other value, any Vercel deployment | Every data route answers `503` with `{"error":{"code":"AUTH_NOT_CONFIGURED",…}}`, `/health` answers `503` with `"status":"misconfigured"`, and the Node server (`npm start`, Docker) refuses to start. |

`/openapi.json` is always served. When keys are set, `/health` and `/openapi.json` need no key and every other route answers `401` without a valid key.

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
