# One Invest — Lộ trình toàn diện (v3, 2026-10-18)

Thay thế các lộ trình rời rạc trước đây. Nguyên tắc: mỗi giai đoạn có tiêu chí
đạt đo được + không phụ thuộc thứ chưa sẵn sàng.

> **v3**: bổ sung track Collector C1–C4 (kèm ADR-0007 — 5 workstream xuyên
> suốt: SPL mã hoá nguồn · CCP hành vi thu thập · DCA GUI+API song song ·
> DQO chất lượng dữ liệu · DR backup). Các phase G bên dưới giữ làm lịch sử;
> phần còn dở map sang C (xem cuối file).

## Trạng thái hiện tại (đã xong)

- **Hà Nội self-collected STR**: 239 listings (calendar + giá VND 97.5%),
  vũ trụ 873 listings union, coverage overlap 2-method đo được (65%)
- **Areas + polygons**: Hà Nội 126 phường OSM 2025 + TP.HCM 167 phường, mọi submarket có polygon;
  listing gán theo tọa độ (point-in-polygon, G0-b) — không còn khu vực theo title
- **Pipeline 2-repo**: collector plugins (airbnb-discovery/listing, osm-boundaries)
  + DATA-CONTRACT (raw immutable + manifest + sha256) + staging → transform →
  canonical → metrics (300) → breakdowns precompute (400) → listing_stats (410)
- **Sản phẩm**: Invest Portal trên ReUI (P0–P5 xong) — Finder, Insight, Listing,
  Yield, So sánh, Saved, auth; trang market 0.03-0.06s
- **ADR**: 0001 stack · 0002 insights-core · 0003 collector split · 0004 đa
  tài sản (Zalo) · 0005 AirDNA nguồn hạng nhất · 0006 agent swarm (sửa bởi 0007)
  · 0007 nền tảng vận hành collector

## Nguyên tắc kiến trúc (không đổi qua các giai đoạn)

1. Mọi nguồn = plugin collector → raw snapshot (DATA-CONTRACT) → transform →
   canonical (source column) → view coalesce → UI.
2. "Nguồn" vs "hiệu chuẩn" là vai trò per-metric-per-city, tự chuyển dịch.
3. Mock/real cùng một contract — đổi nguồn không đổi tầng sau.

---

## Giai đoạn G0 — Dọn các hạng mục dang dở (chạy trước G1)

*Tổng hợp từ audit các đợt trước — chất lượng dữ liệu trước, UI sau.*

| # | Hạng mục | Gốc | Tiêu chí đạt |
|---|---|---|---|
| G0-a | Discovery fallback "Trang cuối" (~13 listings trang 15 bị bỏ) | audit ① | collector bắt được link "Trang cuối", rerun discovery đủ trang |
| G0-b ✅ | **Chuẩn hoá gán khu vực bằng point-in-polygon** (ST_Contains vào 126 phường OSM) thay vì tin theo title — xử lý luôn: areas ngoài tỉnh (Văn Giang, Phục Yên = Hưng Yên/Vĩnh Phúc), area "Hà Nội" tự tham chiếu, trùng slug (Dong Da vs Quận Đống Đa), 20 areas thiếu polygon | audit ⑤ | mọi listing Hà Nội thuộc đúng phường theo tọa độ; không còn area tự-tham-chiếu; số area sạch |
| G0-c | Top Submarkets sort theo metric (ADR/occ/revpar) | audit ⑦ | đổi sort được từ UI |
| G0-d | Trang chi tiết listing (drill-down click tên) | audit ⑧ | /listing/<id> hiển thị chi tiết + calendar |
| G0-e | Cron vận hành chính thức (launchd plist) | audit ⑫ | collector tự chạy tuần không cần tay |

(Các mục audit khác đã có chủ: ③⑨ → G2 AirDNA; ⑩ → G3; ⑬ divergence đã ghi docs.)

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

---

# TRACK COLLECTOR C1–C4 (v3, kèm ADR-0007)

5 workstream xuyên suốt mỗi phase — nguyên tắc chi tiết ở ADR-0007:
**SPL** (mã hoá nguồn) · **CCP** (hành vi thu thập) · **DCA** (GUI+API song
song) · **DQO** (chất lượng dữ liệu) · **DR** (backup).

## C1 — Vận hành hoá collector hiện tại *(không dependency, bắt đầu ngay)*

Việc chính: gộp raw zone về monorepo (snapshots + state + `.airdna-profile`
từ repo cũ; `PROFILE_DIR` dùng path tương đối) · cài launchd cron hằng tuần
(Hà Nội full + HCMC tích lũy) · G0-a "Trang cuối" discovery đủ 15 trang ·
HCMC depth 25 → ≥100 listings.

| Workstream | Việc ở C1 |
|---|---|
| SPL | Bảng `source_registry` local + cột `source` serving chuyển sang mã B; `/ops/sources` bảng giải mã (gated admin) |
| CCP | Jitter + trần/ngày + cửa sổ giờ vào scheduler; incremental calendar; randomized cron delay; smoke test hằng ngày |
| DCA | OpenAPI v1 skeleton + `GET /api/v1/ops/coverage` (freshness, coverage, snapshot cuối) + webhook ngưỡng |
| DQO | `450_dq_checks.sql` (4 trụ) + freshness SLO GUI footer + API |
| DR | pg_dump tuần + rsync mã hoá raw zone; `users` thêm `role` (user\|admin) — clearance portals.md |

**Tiêu chí đạt**: 2 tuần không đụng tay vẫn có snapshot + metrics mới; mọi raw
trong monorepo; HCMC ≥100 listings; `/api/v1/ops/coverage` trả JSON đúng.

## C2 — Agent ingest bridge *(test được ngay với zalo-mock, không cần Zalo thật)*

Việc chính: Collector API `POST /api/v1/agent-report` (localhost, API key
per-agent) **ghi raw snapshot theo DATA-CONTRACT** (`source='zalo-agent'`,
sửa đổi ADR-0006) rồi transform; Ollama + Qwen 27B; benchmark extraction
trên zalo-mock (có ground truth) so với regex transform-zalo; OpenClaw agent
+ skill `real-estate-monitor` trên 1 group test khi user sẵn sàng.

| Workstream | Việc ở C2 |
|---|---|
| SPL | Agent-report theo SPL: raw tầng A (tên thật) → transform ra mã B |
| CCP | Extractor chạy offline trên mock (không chạm platform nào) |
| DCA | `/agent-report` + `GET /api/v1/ops/extraction-quality` (F1 LLM vs regex) |
| DQO | So sánh F1 như một DQ test có ngưỡng |
| DR | — (không dữ liệu mới ngoài raw zone đã backup ở C1) |

**Tiêu chí đạt**: end-to-end agent-report → raw → transform → `sale_offers`
chạy; F1 extract LLM ≥ regex parser (≥80% coverage trên mock).

## C3 — Zalo thật *(chỉ còn logistics user: join 10-20 nhóm)*

Kiến trúc đã chốt sau research OpenClaw source + decision models (2026-10-19):
thu thập **event-driven** qua plugin `zalouser` (tài khoản cá nhân zca-js,
queue durable 30 ngày — KHÔNG poll, không heartbeat 30s như diagram cũ
ADR-0006), tin group → **decision gate Kev-4B local (:8009)** chấm "là tin
rao BĐS?" → chỉ tin đúng mới đánh thức agent 27B → skill
`real-estate-monitor` → `POST :9210/agent-report` (C2). Tiết kiệm ~95% turn
27B (500 tin/ngày, ~30% là BĐS).

Việc chính: login zalouser (QR — user) + allowlist nhóm theo group ID;
cài `decisionModel: typesafe/kev-latest` cho agent dedicated (đã cài plugin
typesafe link từ source, config baseUrl :8009); validate cổng bằng
`pipeline/scripts/bench-gate.mjs` (recall ≥95% là ràng buộc ngưỡng);
viết skill real-estate-monitor; `market_asset_stats` thêm nguồn thật;
đối chiếu mock vs real (phân phối giá, coverage parser ≥60% — Kev làm judge
theo rubric); mock retire giữ lineage.

| Workstream | Việc ở C3 |
|---|---|
| SPL | Mã nguồn Cộng đồng vào serving; nhãn i18n |
| CCP | Event-driven (zca-js listener, không re-poll history), không đăng; gate decision model chạy trước agent turn; fail = lùi + báo; credential registry Zalo (Keychain) |
| DCA | `GET /api/v1/offers` + MCP tool `oneinvest_get_asset_stats` đầu tiên |
| DQO | Test phân phối mock vs real; judge coverage = decision rubric (đúng/thiếu/sai giá) |
| DR | Backup rule cho credential Zalo (Keychain) |

**Tiêu chí đạt**: tin thật chảy về hàng ngày không can thiệp; cổng chặn
recall ≥95% trên mock gt + fallout <10% trên âm tính tổng hợp (bench-gate);
parser ≥60% coverage trên tin thật (Kev judge); không block/captcha quá
ngưỡng circuit breaker.

### Trạng thái as-built (2026-10-19 tối) & 2 giai đoạn còn lại

Đã sống (E2E chứng minh bằng tin mô phỏng "2,6 tỷ" → sale_offers đúng giá):
hook `oneinvest-zalo-pipe` trong gateway (repo: `collector/openclaw/`) →
Kev gate noul ≥0.9 → POST :9210 → snapshot → sale_offers; watcher agent
thinking-low NO_REPLY; launchd `com.oneinvest.{kev,collector-api}` bền reboot;
gate đo 620 mẫu recall 100%/81ms. Log: `~/.openclaw/logs/oneinvest-zalo-pipe.log`.

- **C3-soak (bây giờ → vài ngày, thụ động)**: chờ 4 nhóm chảy thật; theo dõi
  `/ops` + log hook; thu tỷ lệ media-only + phân phối giá thật. Gate vào
  C3-wrap: ~50-100 tin BĐS thật đã qua gate.
- **C3-wrap (2-3 buổi)**: (1) đối chiếu mock-vs-real + judge coverage parser
  (tiêu chí ≥60%) → quyết định retire mock; (2) `GET /api/v1/offers` + MCP tool
  `oneinvest_get_asset_stats`; (3) quyết định media-only bằng số liệu (>20%
  → bật qwen vision :8080); (4) gom 11 deferred minors + drill nhỏ.

## C4 — Cloud + mở rộng

Việc chính: sync local → Supabase (15 phút, outbound-only) → Vercel deploy +
auth teammates; AirDNA E2 submarket focus cities + Track B MCP khi live;
city 3+ theo xếp hạng; MCP server hoàn chỉnh (`oneinvest_query_market`,
`oneinvest_rank_markets`, `oneinvest_get_yield`, `oneinvest_get_coverage`).

| Workstream | Việc ở C4 |
|---|---|
| SPL | **Ranh giới enforcement**: sync chỉ đưa mã B + bảng đổi tên trung tính (`airdna_*` → `ref_calib_*`); **Leak Gate CI** chặn tên thật trong artifact rời máy |
| CCP | SLO 4 tuần không đụng tay kiểm chứng |
| DCA | RBAC role×scope + machine token + audit log + Idempotency-Key mọi trigger |
| DQO | DQ report đám mây (cùng nguồn dữ liệu với GUI) |
| DR | Drill khôi phục 1 lần (RPO 7d / RTO 1d kiểm chứng) |

**Tiêu chí đạt**: dashboard đọc được từ cloud; teammate read-only vào được;
Leak Gate xanh; drill khôi phục pass.

## Map G cũ → C

- G0 còn dở (G0-a, launchd máy mới, gộp raw zone) → **C1**
- G3 (HCMC depth, city 3+ theo rank) → **C1** (depth) + **C4** (city 3+)
- G4 (Zalo thật) → **C3**
- G2 còn dở (E2 submarket, Track B MCP) → **C4**
