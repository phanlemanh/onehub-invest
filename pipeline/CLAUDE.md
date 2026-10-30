# pipeline/ — Transform & Metrics

## What This Does
Reads raw snapshots from `../collector/snapshots/` → validates → transforms → writes to PostgreSQL.

## Key Scripts

| Script | Purpose |
|--------|---------|
| import-airbnb.mjs | Import snapshots (verify sha256, write staging tables) |
| transform-airbnb.mjs | Staging → canonical (listings, nights); area = phường chứa tọa độ; ngoài mọi phường → nghỉ `ngoai_phuong` mang toạ độ lần thu mới (reassign không đánh thức bằng toạ độ cũ) |
| transform-zalo.mjs | Zalo posts → sale_offers, rent_lt_offers (gạt post thử qua lib/test-posts.mjs); số đọc trên chữ đã gạt URL/SĐT (đuôi nhóm nghìn của giá đồng không bị gạt, kể cả khi sau là khoảng trắng + 1–2 chữ số), luật giá VN, chặn giá phi lý, phường theo thị trường nhóm (N1) |
| transform-media.mjs | Bảng `media` (RESO Media, NH1) cho tin sống S03/S05/S06; S03 nối thêm ảnh của tin chỉ-ảnh vào offer của tin chữ gần nhất cùng người, dưới 2 phút (PL28, `lib/gop-anh.mjs`) |
| refresh-bait-gap.mjs | Bait gap P1 + registry sellers (xoá người bán không còn tin, audit); `buocDem` rồi dựng danh bạ Người trong giao dịch riêng |
| scripts/test-data-residue.mjs | Đếm tin sinh từ post thử còn sót; `--simulate` chạy thử dọn rồi ROLLBACK |
| transform-hcmc-simple.mjs | HCMC-specific (market-first, then phường assign) |
| transform-airdna.mjs | AirDNA XHR → airdna_markets, metrics, scores |
| vocab.mjs | Sổ từ vựng một nguồn (PL6): `--write` sinh hằng từ `mappings.yaml` `enums:` · `--check` · `--lint` (enum viết tay) · `--check-db` (ref_* + CHECK) · `--check-field-targets` |
| reassign-areas.mjs | Upsert phường OSM (areas + polygon), point-in-polygon mọi listing VN, listing ngoài mọi phường NGHỈ (`ngoai_phuong`, không xoá), xoá area không phải phường OSM |
| scripts/nap-lai-ba-luot.mjs | Thước PL14: ba lượt nạp S03→S05→S06→airbnb trong giao dịch ROLLBACK, ma trận quyết định/liên kết 7×2; `--doi-chung=039\|khong-chuyen` |
| phat-bieu-cat-chuyen.mjs | PL15 bước chuyển: giá trị có sẵn của năm cột → phát biểu `legacy`, mở cổng phân xử; `--thu` ROLLBACK |
| scripts/dung-lai-canonical.mjs | Thước PL15: xoá năm cột rồi dựng lại trong giao dịch ROLLBACK (0 ô lệch); `--nguon-goc`; `--doi-chung=…` |
| scripts/phat-bieu-chay-that.mjs | PL15: ba transform + phân xử trên dữ liệu thật, đo giây, ROLLBACK (`--thu`) |
| trang-thai-chao.mjs | PL19: bộ ghi bằng chứng + phân xử trạng thái chào mọi tin (059 `ghi_bang_chung_chao`, `resolve_offer_status`), in đếm năm trạng thái — bước cloud-sync ngay trước `bac-du-lieu`; khoá 56056 |
| scripts/trang-thai-roundtrip.mjs | Thước PL19 (AC-8): trang-thai-chao hai lần trên DB thử, đếm độc lập, chiều đỏ DB không tới được |
| dung-nguoi.mjs | DB2b: dựng danh bạ Người + vai người đăng một lượt (chạy đêm đi qua `buocDem` của refresh-bait-gap); `--thu` ROLLBACK |
| scripts/nap-lai-nguoi.mjs | Thước DB2b: hai lượt transform + bước đêm trong giao dịch ROLLBACK, lượt 2 bằng 0, đối chứng bỏ tra bí danh; `--doi-chung-hong` |
| label-mau.mjs | PL8: tập tin mẫu lát OCP1 có đáp án biết sẵn (`--lat ocp1 --n 200 --seed s [--out f.jsonl]`); hàm thuần `lib/tap-mau.mjs` + khuôn `lib/khuon-mau-ocp1.mjs`, không DB, không đường tới canonical/stg |
| do-danh-ba-sdt.mjs | SD5: năm kiểm trục SĐT của danh bạ Người (audit 30/10 N1–N5) theo nguồn S03/S05, `--write` ghi `dq_check_results` một dòng mỗi kiểm mỗi ngày; bước cuối `scripts/cloud-sync.sh` |
| eval-classify.mjs | PL9: độ đúng từng ô (cách đọc × trường × phân khúc) theo cận dưới Wilson so ngưỡng F3 (`npm run eval:classify -- --lat ocp1 [--split dev] [--dry]` → `dq_check_results`, `--tap-mau <tệp.jsonl>` chỉ in); lõi `lib/eval-classify.mjs`, cách đọc `parser` |
| finalize-hanoi.sh | Full pipeline: import → reassign-areas → transform → 300/400/410 |

## SQL Files (execute in order)

| File | Purpose |
|------|---------|
| 300_metrics.sql | Build market_metrics from nights + listings |
| 400_breakdowns.sql | Precompute ADR by size, room type, top listings |
| 410_listing_stats.sql | Rebuild listing_stats (nights/booked/revenue/occupancy + nights90/booked90 per listing) — app không gộp nights runtime |
| 500_asset_stats.sql | Compute median prices + yield per phường |

## Database Schema (key tables)

```
areas (id, parent_id, region_type, name, geom)
listing_records (id, area_id, …, retired_at, retired_reason, originating_system_key) — bảng bản ghi (044)
listings = VIEW sống của listing_records (retired_at IS NULL) — mọi chỗ ĐỌC dùng view
nights (listing_id, night, available, price)
market_metrics (area_id, month, listing_count, revenue, adr, occupancy, revpar)
sale_offer_records (offer_id, …, retired_at, retired_reason, superseded_by, originating_system_key) — bảng bản ghi (044)
sale_offers = VIEW sống của sale_offer_records (offer_id, area_id, kind, price_vnd, area_m2, confidence, …)
history_transactional (resource_record_key = offer_id, field_name ListPrice|StandardStatus, change_type, …) — lịch sử giá/trạng thái (059, trigger trên sale_offer_records, chỉ local); property_price_history = VIEW gom theo căn
market_asset_stats (area_id, kind, median_perm2, median_rent)
parties / registry_aliases / registry_events / party_roles — danh bạ Người (055, chỉ-thêm, chỉ local; khoá `pty_<ULID>`)
airdna_markets / airdna_scores / airdna_market_metrics
```

## Conventions
- **City-parametric**: most scripts accept city as arg (`node transform-airbnb.mjs hcmc`)
- **Staging → canonical**: raw data goes to stg_* tables first, then transforms to clean tables
- **Point-in-polygon**: area của listing VN = phường OSM chứa tọa độ (ST_Covers). KHÔNG suy area từ title discovery
  (title dùng tên quận cũ / tên tỉnh / tỉnh lân cận → area trùng, ngoài tỉnh — G0-b). Submarket VN chỉ là phường OSM
  (`meta.source = 'osm-phuong'`); listing ngoài mọi phường nghỉ `ngoai_phuong` (rời view `listings`, đêm giữ nguyên; staging giữ nguyên).
- Sau MỌI transform VN (kể cả transform-hcmc-simple): `node reassign-areas.mjs` rồi 300 + 400.
- **Idempotent**: scripts can run multiple times without duplicating data (ON CONFLICT)

## Gotchas
1. **pg client**: uses `pipeline/node_modules/pg` (not app's), run `npm install` in pipeline/
2. **Docker psql**: `docker compose exec -T -e PGPASSWORD=oneinvest db psql -h localhost -U oneinvest -d oneinvest`
3. **Snapshot paths**: relative `../collector/snapshots/<city>/<snapshot-id>/`
4. **Không xoá tin/listing (PL14, 044)**: tin vắng lượt và listing ngoài phường chỉ NGHỈ (`retired_at`); 6 khoá ngoại tới
   hai bảng bản ghi là RESTRICT. Đường GHI dùng `sale_offer_records`/`listing_records` (upsert gỡ `retired_at`); đường
   ĐỌC dùng view. `pipeline/lib/scan-delete.mjs` (test `nap-lai.test.mjs`) đỏ khi có `DELETE FROM`/`TRUNCATE` nhắm chúng.
5. **Khoá tin S03/S05 «dính»** (`lib/offer-key.mjs`): `offer_id` theo post, không theo nội dung — đổi giá/DT/PN/parser
   không đổi khoá. Đừng quay lại băm nội dung.
6. **Test DB nạp 044 trong giao dịch** khi DB chưa áp, và giữ `pg_advisory_xact_lock(33033)` — thiếu khoá thì deadlock
   với các test nạp migration song song.
7. **Năm cột phân loại chỉ qua phân xử (PL15, 045)**: `property_type`, `bedrooms`, `bathrooms`, `street_raw`, `block_raw`
   do `resolve_offer_fields` dựng từ `field_assertions` — bộ đọc ghi phát biểu (`lib/assert.mjs`), không UPDATE thẳng
   (`lib/scan-canonical-write.mjs` đỏ). Chưa cắt chuyển (`ops_audit phat-bieu:cat-chuyen`) thì phân xử dừng có tên. Test
   và thước trong giao dịch: `napPhatBieu(c)` (`lib/nap-045.mjs`) nạp 045 + mở cổng trong giao dịch.
