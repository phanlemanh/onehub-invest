# onehub-data-api

Real estate data API for Vietnam — markets, listings (RESO Data Dictionary 2.1), price statistics.

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

# Apply the sample schema (one file, idempotent)
psql $DATABASE_URL -f db/schema.sql

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
| `LISTING_KEY_SECRET` | *(empty)* | Secret for the `listingKey` of short-term rentals (HMAC-SHA256). **Required** outside `NODE_ENV=development` / `NODE_ENV=test`: without it the server refuses to start and short-term listings answer `503 LISTING_KEY_NOT_CONFIGURED` |
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
| GET | `/v1/listings` | Listings — for sale, long-term rent, short-term rent — one shape for every `kind` (see below) |
| GET | `/v1/listings/:listingKey` | One listing |
| GET | `/v1/price-stats` | Price statistics by area (median, p25, p75, yield): `?area=` or `?market=` |
| GET | `/v1/coverage` | Self-collected listing count by market |
| GET | `/v1/properties?project=` | Property (building directory): buildings of one project — units are never listed |
| GET | `/v1/properties/lookup?project=&building=&unitNumber=` | Property: look up ONE unit you already know by project + building + unit number |
| GET | `/v1/properties/:universalPropertyId` | Property: one building |
| GET | `/v1/properties/:universalPropertyId/units/:unitKey` | Property: one unit |
| GET | `/v1/deals` | **410 Gone** — merged into `/v1/listings?minBelowMedianPct=` |
| GET | `/v1/asset-stats` | **410 Gone** — renamed `/v1/price-stats` |

### Response fields

#### Listing

A listing is one record of the RESO **Property** resource (RESO calls a listing "Property"; this API's own
`/v1/properties` is the building and unit registry — a different thing). Field names follow the
[RESO Data Dictionary 2.1](https://ddwiki.reso.org) in camelCase; values of `propertyType`, `propertySubType`,
`leaseAmountFrequency`, `livingAreaUnits`, `pricePerAreaUnit` are DD 2.1 `StandardName` lookups. The key list lives in
one file, `src/contract/listing.ts`; `/openapi.json` (`components.schemas.Listing`) is generated from it.

Query: `kind` (`sale` · `rent_lt` · `rent_st`; absent = all three), `market`, `area`, `bedroomsTotal`, `limit` (≤ 200,
default 50), `offset`. Good-price filter: `minBelowMedianPct=<n>` (0–50) keeps sale and long-term-rent listings priced
at least `n`% below the median of their comparison group, ordered by that gap; add `project=<project node id>` to compare
inside a project. Errors are `{ "error": { "code", "message" } }`; an unknown `kind` answers `400`.
If the server's list of sources that are never shown publicly (`SOURCE_HIDDEN`, generated) is empty or unusable, every
`/v1/listings` call — list, good-price filter, single listing — answers `503` with code `HIDDEN_SOURCES_NOT_CONFIGURED`
instead of returning listings: the API fails closed rather than exposing sources that must stay hidden.

Every item carries every key below (`null` when it does not apply to that `kind`):

| Key | RESO DD 2.1 | Old name (≤ 0.1) |
|---|---|---|
| `listingKey` | ListingKey | `offerId` (deals) · `id` (listings) |
| `kind` | extension | — |
| `originatingSystemName` | OriginatingSystemName (source code `S0x`) | — |
| `propertyType`, `propertySubType` | PropertyType, PropertySubType | `propertyType` (internal code) |
| `listPrice` | ListPrice | `priceVnd` |
| `leaseAmount`, `leaseAmountFrequency` | LeaseAmount, LeaseAmountFrequency (`Monthly` · `Daily`) | `priceVnd` · `priceListed` |
| `livingArea`, `livingAreaUnits` | LivingArea, LivingAreaUnits (`Square Meters`) | `areaM2` |
| `salePricePerArea`, `leasePricePerArea`, `pricePerAreaUnit` | SalePricePerArea, LeasePricePerArea, PricePerAreaUnit | `pricePerm2` |
| `bedroomsTotal` | BedroomsTotal | `bedrooms` |
| `bathroomsTotalInteger` | BathroomsTotalInteger | `bathrooms` |
| `city` | City (ward name) | `phuong` · `area.name` |
| `mlsAreaMinor`, `mlsAreaMajor` | MLSAreaMinor (ward id), MLSAreaMajor (market id) | `area.id`, `marketId` · `market.id` |
| `latitude`, `longitude` | Latitude, Longitude | `lat`, `lng` |
| `onMarketTimestamp` | OnMarketTimestamp | `firstSeen` |
| `media` | Media (always `null` for now) | `photoUrls` · `photos` |
| `lastSeenTimestamp` | extension | `lastSeen` |
| `confidence` | extension | `confidence` |
| `repostCount` | extension | `nReposts` |
| `listingTitle`, `spaceType`, `accommodates`, `minimumNights`, `reviewCount` | extension (short-term rent) | `name`, `roomType`, … |
| `occupancyRate`, `averageDailyRevenue` | extension (short-term rent, from the nightly calendar) | `stats.occupancy`, `stats.revenue` |
| `belowMedianPct`, `comparableMedianPricePerArea`, `priceRank` | extension (good-price comparison) | `discountPct`, `medianPerm2`, `rank` (deals) |

Extensions are declared with their DD lookup in `pipeline/mappings.yaml` (`api_extensions.listing`) of the main repo.
`priceRank` (when the price-rank table is available) keeps the sub-keys `level`, `node`, `n`, `median`, `p20`,
`percentile`, `label`, `needsVerification`, `metric`, `bedroomsGroup`, `reason`. `meta`: `total`, `limit`, `offset`.

`GET /v1/markets`, `GET /v1/markets/:id` — `id`, `name`, `countryCode`, `listingCount` (self-collected short-term rental
listings, wards included); the list is ordered by `listingCount` then name, `meta`: `total`, `limit`.
`GET /v1/markets/:id/submarkets` — `id`, `name`, `listingCount`, ordered by name; `meta`: `total`.

`GET /v1/coverage` — one row per Vietnamese market: `areaId`, `name`, `ourListings` (self-collected short-term rental
listings in the market, including its wards). Markets with no listings yet are included with `ourListings: 0`.

Data boundaries: this API never returns the text, images, group name or sender name of community posts, and never
reads or returns calibration-source data — those stay in the internal operations portal.

## Property — danh bạ nhà (building directory)

**«Property» here is OneHub's building directory, NOT the RESO `Property` resource.** In RESO Data Dictionary 2.1 the
`Property` resource is a listing (that is `/v1/listings`); a physical building is identified by `UniversalPropertyId` plus
the `Building` resource. Field names inside follow DD 2.1 (`Building.*`; `Property.UnitFloorLocation`, `LivingArea`, …).
The single key list is `src/contract/property.ts`; `/openapi.json` publishes it as `PropertyBuilding`, `PropertyUnit`,
`PropertyUnitLookup`.

| Key | DD 2.1 | Meaning |
|---|---|---|
| `universalPropertyId` | Building.UniversalPropertyId | building UPI (`urn:onehub:upi:1:VN:<ISO 3166-2>:<buildingKey>`) |
| `buildingKey` | Building.BuildingKey | opaque `bld_…` key |
| `buildingName` | Building.BuildingName | building name |
| `complexName` | Building.ComplexName | sub-zone of the project |
| `subdivisionName` | Building.SubdivisionName | project name |
| `projectId` | extension | project node id — pass it as `?project=` |
| `city` | Building.City | ward (Vietnamese addresses are ward + province) |
| `stateOrProvince` | Building.StateOrProvince | ISO 3166-2:VN code (local value — the DD lookup lists US/CA states) |
| `country` | Building.Country | `VN` |
| `catalogTier` | extension | `xac_minh` · `suy_ra_manh` · `mot_loi_khai` (catalogue confidence) |
| `unitCount` | extension | active units in the building |
| `activeListingCount` | extension | active listings linked to the building (refreshed every 10 minutes) |
| `unitKey` | extension | opaque `unt_…` unit key |
| `unitFloorLocation` | Property.UnitFloorLocation | floor |
| `livingArea`, `livingAreaUnits` | Property.LivingArea, LivingAreaUnits | area, `Square Meters` |
| `bedroomsTotal`, `bathroomsTotalInteger` | Property.BedroomsTotal, BathroomsTotalInteger | rooms |
| `propertySubType` | Property.PropertySubType | `Condominium`, `Unimproved Land`, or null |
| `unitNumber` | Property.UnitNumber | **lookup only**: echoes the unit number you sent |

Rules: units are looked up one at a time — there is no unit listing, no floor/stack key, and `unitKey` is random, so one
unit does not lead to another. Source-system codes are never returned and never accepted as input
(`400 SOURCE_CODE_NOT_ACCEPTED`). Ambiguous names return `400 AMBIGUOUS_PROJECT` / `AMBIGUOUS_BUILDING` /
`AMBIGUOUS_UNIT`; merged records return `404 MERGED` with `mergedInto`. Where the directory tables are absent the routes
return `503 DIRECTORY_UNAVAILABLE` — today the directory lives only on the collection machine, not on the cloud database.

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

`db/schema.sql` is the one sample schema for this API: PostgreSQL with PostGIS and pgcrypto (`hmac()` for the
`listingKey` of short-term rentals). It builds every table and view the routes read on an empty database; `seed.sql`
adds demo rows for every route. The Docker setup applies `db/` on first start (`docker-entrypoint-initdb.d`).

Key tables:
- `areas` — markets and wards with PostGIS polygons
- `listings` — short-term rental listings; `nights` — nightly availability and pricing calendar
- `sale_offers` — for-sale and long-term-rent listings
- `offer_price_rank` — price rank of each listing in its comparison group (computed by the pipeline); `v_ruler_p2` —
  ward × property-type median price per m², the fallback when the rank table is empty
- `market_metrics`, `market_asset_stats` — monthly market metrics, price statistics per area

## Self-Hosting

### Railway / Fly.io / Render

1. Create a PostgreSQL database with PostGIS extension
2. Set `DATABASE_URL` environment variable
3. Deploy this repo
4. Apply `db/schema.sql`, then `seed.sql`

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
