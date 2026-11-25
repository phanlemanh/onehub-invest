# collector/ — Data Collectors

## Architecture
- Plugin-based: each source is a collector in `src/collectors/`
- Registered in `src/collectors/index.ts`
- Core handles: scheduler, rate limiting, checkpoint/resume, storage
- Output: raw snapshots (gzip + sha256 manifest) in `snapshots/`

## Collectors

| ID | Source | Rate | Output |
|----|--------|------|--------|
| airbnb-discovery | airbnb.com.vn search | 0.5 req/s | listing IDs + titles |
| airbnb-listing | airbnb.com.vn /rooms | 0.35 req/s | details + calendar + prices |
| airdna-research | app.airdna.co | 0.3 req/s | market metrics + scores |
| osm-boundaries | Overpass API | 0.2 req/s | phường/province polygons |
| zalo-mock | Mock generator | N/A | fake posts for testing |

## Key Technical Notes

1. **Headful Chrome only** — headless gets anti-bot blocked (Airbnb, AirDNA)
2. **System Chrome** via `channel: "chrome"` (no browser download needed)
3. **Pagination**: `A[aria-label^='Trang N']` links, NOT `pagination-next-button` testid
4. **JS click**: `el.evaluate(el => el.click())` — actionability click fails on "element outside viewport"
5. **S02 profile (AirDNA)**: persistent Chrome profile at `.airdna-profile/` (đổi chỗ bằng `AIRDNA_PROFILE_DIR`). Phiên KHÔNG vĩnh viễn — hết thì Mạnh tự đăng nhập lại bằng lệnh `login`. Bộ thu không mở route dữ liệu `/data/vn` (bị trang thử thách chặn trình duyệt có kết nối gỡ lỗi, 24/11): nạp bộ khung ứng dụng qua đường dẫn không bị thử thách, CHỜ ứng dụng tự cấp token (15 phút) rồi mới đọc — chú thích 2511-s02 trong `src/collectors/airdna-research.ts`
6. **Checkpoint**: `state/<city>__<source>.json` stores progress for resume
7. **Batch mode**: `AIRBNB_LISTING_BATCH=25` (default 25 listings per run)

## Commands
```bash
npm run collect -- list-cities
npm run collect -- list-sources
npm run collect -- collect --city hanoi --source airbnb-discovery
AIRBNB_LISTING_BATCH=50 npm run collect -- collect --city hanoi --source airbnb-listing
npm run collect -- login --source airdna-research   # Mạnh tự đăng nhập — mở Chrome thường với đúng profile của bộ thu
```

## Adding a New Collector
1. Create `src/collectors/my-source.ts` implementing `Collector` interface
2. Import + register in `src/collectors/index.ts`
3. Add city config in `src/config/cities.ts` if new city
4. Write raw items (source, sourceId, kind, fetchedAt, payload, meta)
5. Return CoverageReport (discovered, captured, failed, methods)

## Don't
- Don't parse/normalize data in collector (that's pipeline's job)
- Don't use headless Chrome for anti-bot sites
- Don't commit .airdna-profile/ or snapshots/
- Don't modify raw snapshots after writing (immutable by design)
