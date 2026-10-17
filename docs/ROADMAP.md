# One Invest — Lộ trình toàn diện (v2, 2026-10-18)

Thay thế các lộ trình rời rạc trước đây. Nguyên tắc: mỗi giai đoạn có tiêu chí
đạt đo được + không phụ thuộc thứ chưa sẵn sàng.

## Trạng thái hiện tại (đã xong)

- **Hà Nội self-collected STR**: 239 listings (calendar + giá VND 97.5%),
  vũ trụ 873 listings union, coverage overlap 2-method đo được (65%)
- **Areas + polygons**: 62 khu vực từ titles, 34/54 có polygon OSM (126 phường 2025)
- **Pipeline 2-repo**: collector plugins (airbnb-discovery/listing, osm-boundaries)
  + DATA-CONTRACT (raw immutable + manifest + sha256) + staging → transform →
  canonical → metrics (300) → breakdowns precompute (400)
- **Sản phẩm**: /vn/hanoi + 62 submarket, KPI/benchmark/charts/deep-sections,
  supply tracking, mini-map choropleth, trang market 0.03-0.06s
- **ADR**: 0001 stack · 0002 insights-core · 0003 collector split · 0004 đa
  tài sản (Zalo) · 0005 AirDNA nguồn hạng nhất (buy-now own-later)

## Nguyên tắc kiến trúc (không đổi qua các giai đoạn)

1. Mọi nguồn = plugin collector → raw snapshot (DATA-CONTRACT) → transform →
   canonical (source column) → view coalesce → UI.
2. "Nguồn" vs "hiệu chuẩn" là vai trò per-metric-per-city, tự chuyển dịch.
3. Mock/real cùng một contract — đổi nguồn không đổi tầng sau.

---

## Giai đoạn G1 — Mock Zalo + Tính năng Yield (chạy NGAY, không dependency)

*Không chờ AirDNA, không chờ join nhóm. Mục tiêu: tính năng yield hoàn chỉnh
chạy trên dữ liệu giả lập có kiểm soát.*

| Việc | Chi tiết | Tiêu chí đạt |
|---|---|---|
| `zalo-mock` collector | Sinh tin giả: 200 bán + 150 thuê LT Hà Nội; text tiếng Việt format môi giới thật ("Bán CHCC 2PN 65m2 Mễ Trì, 45tr/m2…"); giá theo gradient phường (Hoàn Kiếm đắt, xa trung tâm rẻ); ~20% repost (test dedup); ~25% tin thiếu trường (test confidence); manifest ghi rõ `source: zalo-mock` | snapshot qua đúng DATA-CONTRACT |
| `transform-zalo.mjs` | Pipeline 5 bước: clean → parse regex VN → confidence → dedup → offers | **coverage parser ≥80% trên mock** (biết ground truth — lợi thế của mock) |
| Migration + 500_asset_stats | `stg_zalo_posts` → `sale_offers`/`rent_lt_offers` (source='mock') → `market_asset_stats` (median, p25-p75, yield STR & LT) | bảng chạy, median hợp lý gradient |
| UI Yield | Section "Bán & Thuê dài hạn" + card "Yield theo quận" [giá/m² \| thuê LT \| STR revenue (ta) \| yield STR % \| yield LT %] + **badge "SIMULATED DATA"** vàng rõ ràng | /vn/hanoi hiển thị yield đủ 10+ quận |

## Giai đoạn G2 — AirDNA nguồn hạng nhất (ngay khi user mua tài khoản)

| Việc | Chi tiết | Tiêu chí đạt |
|---|---|---|
| Crosswalk + source | `area_sources` + cột `source` market_metrics + view coalesce (self > airdna) | view trả đúng ưu tiên |
| Track A collector | `airdna-research`: web app logged-in, capture explorer API — E1: market-level toàn quốc (rank + metrics mọi tỉnh); E2: submarket Hà Nội + focus cities | ≥30 tỉnh thành có metrics; trang /vn/{tỉnh} mở được |
| Bản đồ quốc gia | `osm-boundaries` admin_level=4 (tỉnh) → Market Finder choropleth toàn quốc | map quốc gia render + click vào tỉnh |
| Đối chiếu UI | Section "Đối chiếu AirDNA" 3 cột + Market Score badge + card hiệu chuẩn (ratio, cảnh báo lệch >20%) | Hà Nội + các quận có đủ |
| (Khi MCP live) Track B | `airdna-mcp` OAuth song song Track A | — |

## Giai đoạn G3 — Mở rộng tự thu theo xếp hạng

- Chọn city thứ 2 theo `rank_markets`/kết quả G2 (không theo cảm tính).
- Chạy chuỗi sẵn có: discovery → listing → polygons → metrics. Mỗi city xong,
  `self` thế chỗ `airdna` trong view (tự chuyển dịch vai trò).
- Tiêu chí: city 2 có trang insights đầy đủ như Hà Nội + AirDNA còn là cột đối chiếu.

## Giai đoạn G4 — Zalo THẬT (cuối cùng, khi user sẵn sàng join nhóm)

| Việc | Chi tiết |
|---|---|
| Z0 (user, duy nhất) | Join 10-20 nhóm Zalo môi giới Hà Nội; login session Chrome collector |
| `zalo-groups` collector | Poll theo checkpoint, CHỈ ĐỌC, 1-2 lần/ngày; raw posts → cùng contract |
| Swap mock → real | transform-zalo không đổi; `market_asset_stats` thêm source='zalo' thật; mock retire (giữ lịch sử) |
| Đánh giá chéo | So mock vs real: phân phối giá, coverage parser trên tin thật (mục tiêu ≥60%) |
| Mở rộng | Real data cho các focus city của G3 |

## Vì sao thứ tự này tối ưu

1. **G1 không chờ ai** — yield feature xong sớm, demo được ngay, và parser được
   đo chính xác trên mock có ground truth (điều không thể với tin thật).
2. **G2 unlock bằng tiền của user** — mọi thứ khác đã sẵn sàng chờ tài khoản.
3. **G3 dùng dữ liệu G2 để chọn** — expansion theo evidence.
4. **G4 chỉ còn việc vận hành** (join nhóm) — mọi tầng đã build + test từ G1;
   rủi ro logistics bị đẩy về cuối, không chặn gì phía trước.

## Tóm tắt dependency

```
G1 (mock+yield) ──┐
                  ├──> G3 (city 2..N theo rank) ──> G4 (Zalo thật)
G2 (AirDNA) ──────┘        cần crosswalk + source từ G2
```
G1 ∥ G2 song song được; G3 cần G2; G4 cần G1 (tính năng) + user (nhóm).
