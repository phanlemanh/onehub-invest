# One Invest — ROADMAP v4 MASTER (2026-10-22)

> **NGUỒN CHÂN LÝ DUY NHẤT cho mọi phiên AI / người mới.** Thay thế ROADMAP
> v3 (10/18 — lưu ở ROADMAP-v3-archive.md) và mọi lộ trình rời. Đọc file
> này trước khi đề xuất bất kỳ việc gì. Cập nhật file này mỗi khi chốt
> quyết định mới (luật AGENTS.md).

## 0. Cách dùng

- Mọi phiên bắt đầu: đọc §1 nguyên tắc + §3 quyết định đã chốt (KHÔNG hỏi
  lại user những gì đã chốt), rồi **`LO-TRINH.html` / `docs/plan/lo-trinh.json`** để biết việc kế tiếp.
- Làm xong việc: cập nhật §2 as-built; trạng thái việc máy tự suy từ `_acceptance/<slug>/` lên lộ trình.
- Việc mới phải tra §3 xem đã chốt chưa; quyết mới → ghi §3.

**Mỗi loại thông tin một chỗ** (Mạnh chốt 23/10):

| Loại | Ở đâu | Ai cập nhật |
|---|---|---|
| Mục đích, mục tiêu, thước đo | `docs/product/FRAMING.md` | Mạnh duyệt, có nhật ký §9 |
| Hiến pháp, quyết định đã chốt | §1, §3 của tệp này + `docs/adr/` | phiên làm việc, sau khi Mạnh chốt |
| **Việc phát triển sắp làm + mốc** | **`docs/plan/lo-trinh.json`** (trang `LO-TRINH.html`) | thêm bằng cắt lượt (`/acceptance-gate:cat-luot`) từ một bản phạm vi `docs/plan/pham-vi-*.md`; mốc ở khối `moc` |
| Trạng thái từng việc | máy suy từ `_acceptance/<slug>/`, hiện trên `LO-TRINH.html` | không ai ghi tay |
| As-built + chỉ mục | §2, §4 của tệp này — §4 trỏ mã hàng của lộ trình, không chép danh sách việc | phiên làm xong việc |
| Căn cứ (audit, review, nghiên cứu) | `docs/audit/`, `docs/architecture/`, `docs/research/` | đầu vào của cắt lượt, không phải danh sách việc |
| Bối cảnh khi mở vòng một hàng (đọc gì cho hàng nào, quyết định còn chờ chặn hàng nào, việc của người) | `docs/plan/BOI-CANH.md` | phiên cắt lượt; cập nhật khi cắt đợt mới hoặc chốt quyết định |
| Nguồn của bản phạm vi — nghiên cứu, thảo luận, quyết định đã chưng cất (tầng tri thức, kit 2.34.0) | kho RIÊNG TƯ `phanlemanh/onehub-invest-tri-thuc` (`~/dev/onehub-invest-tri-thuc`, khai `tri_thuc` trong `_acceptance/config.yaml`): `raw/` bất biến + `wiki/nen`, `wiki/dot`; khoá `nguon` của bản phạm vi là đường trỏ băm `onehub-invest-tri-thuc:wiki/dot/<đợt>.md#<băm>` | ghi bằng `/tri-thuc:ghi`, kiểm `/tri-thuc:kiem`; tầng A không vào cả kho riêng |
| Giao việc cho ZCode | kênh tin (issue #9) — **mỗi lời giao ghi mã hàng** của lộ trình | điều phối liên làn |

## 1. Nguyên tắc bất biến (hiến pháp)

> Khung mục đích · mục tiêu · thước đo: **`docs/product/FRAMING.md`** (Mạnh duyệt 23/10). Hiến pháp
> dưới đây là luật kỹ thuật phục vụ khung đó; việc mới nói nó phục vụ phía nào, câu hỏi nào, thước đo nào.

1. **Dữ liệu**: KHÔNG scrape AirDNA cho sản phẩm; RESO-first (ADR-0011 —
   tra DD trước khi bịa field); migration-only (AGENTS.md #3); metrics
   precompute server-side.
2. **LLM-off-data-path**: LLM/agent chỉ gate/judge/extract có audit +
   evidence; KHÔNG bao giờ sửa dữ liệu trực tiếp. Regex/structured là
   đường chính.
3. **SPL**: mã nguồn S0x (ADR-0007); tầng A (tên nguồn thật, hồ sơ người dùng app,
   định danh tài khoản thu, phiên/khoá) KHÔNG bao giờ rời máy thu. Người bán, tên nhóm
   thu là tầng C; nội dung bài, ảnh tin, thẻ duyệt lên cloud cho vai ops (ADR-0007
   sửa đổi 23/10, 24/10, 26/10).
4. **Observability là điều kiện ra quyết định**: nguồn mới phải hiện trên
   /ops ngay (feed health), hành vi thu phải đo được (CCP/DQO).
5. **An toàn social**: agent LLM không bao giờ gửi tin vào nhóm xã hội
   (lockdown 7 lớp + watchdog runtime guard — 2 sự cố đã xảy ra).
6. **Local-first AI**: Qwen 27B (MTPLX :8000) + Kev-4B gate (81ms) là mặc
   định; cloud (OpenAI Decisions) chỉ cho dữ liệu phi-PII.
   *(23/10: Mạnh nêu cần AI Gateway chọn model theo việc + biết chi phí — đề xuất sửa luật này ở review
   phân loại §0.4 M1, chờ Mạnh chốt.)*
7. **Đơn vị nghĩ là CĂN NHÀ**: "Một Căn Nhà" (entity properties) là đơn vị
   phân tích; nguồn chỉ là evidence.
8. **Đo trước khi build**: không graph/vector/infra mới trước khi số liệu
   chứng minh nhu cầu (bài học Mem0 bỏ graph).

## 2. Kiến trúc AS-BUILT (2026-10-22)

### 2.1 Monorepo onehub-invest (private, ADR-0012)
```
app/        Invest+Ops portal (Next.js; prod Vercel + Supabase)
data-api/   public standalone Hono (subtree → onehub-data-api)
collector/  thu thập (hooks, CCP, source_groups — quản trị /ops/sources)
agent/      onehub-ai-agent (kiến trúc chốt §3.5-3.6)
pipeline/ db/ docs/ tools/sync-public (overlay sanitise)
```
`~/dev/one-invest` = symlink → `~/dev/onehub-invest` (launchd cũ chạy được).
DB local `one-invest-db` (PostGIS :5433 trên colima) tự chạy lại khi Docker/máy khởi động lại:
`restart: unless-stopped` trong `db/docker-compose.yml` (2026-10-23, AU7) — kiểm `bash scripts/check-db-autostart.sh live`.
Public mirrors LIVE: onehub-invest-app + onehub-data-api.

### 2.2 Pipeline dữ liệu 5 tầng
```
thu (S0x, launchd tự động) → raw snapshots (DATA-CONTRACT)
→ stg_* → transform (parser VN + phone + RESO property_type; S03/S05 upsert + đối soát
  offer cũ qua `writeOffers` — đề xuất enrich + thẻ duyệt sống qua nạp lại, 039;
  gạt post thử ở đầu đọc qua `lib/test-posts.mjs` — snapshot giả/agent thử/nhóm TEST, audit
  `transform:reject-test`, PL2)
→ enrichment_proposals (E1/E2 đề xuất → luật xác định / /ops/review;
  E1 trái LLM → thẻ đối chiếu, người chọn; E1 không suy land từ tên nhóm;
  hoàn tác có audit qua `revert_enrichment` (036) + CLI enrich-revert;
  không UPDATE thẳng canonical, không lên cloud)
→ sale_offers (canonical; price_tier P0/P1/P2; CHECK enums VALIDATE ở 043)
→ properties (entity "Một Căn Nhà", Stage A/B) → ruler v_ruler_p2_*
→ sản phẩm: Deals v2 ở /ops/deals (bait_gap; SĐT chỉ admin, local) · G3 calculator (STR tự thu) · /ops panels
```
- Sổ từ vựng một nguồn (PL6, `_acceptance/so-tu-vung-mot-nguon`): khối `enums:` của `pipeline/mappings.yaml` — 9 trục
  (kind, property_type, confidence, price_tier, enrich_field, listing_intent, offer_status, data_level, capability_level)
  theo khuôn RESO Lookup. `node pipeline/vocab.mjs --write` sinh hằng `pipeline/lib/vocab.generated.mjs`,
  `agent/src/vocab.generated.ts`, `app/src/lib/vocab.generated.ts` + khối «Từ vựng dữ liệu» của CONTEXT.md; `--lint` đỏ khi
  có enum viết tay ngoài sổ (8 ngoại lệ có lý do ở `enums_lint_allow`); `--check-db` so `ref_lookup`/`ref_field_lookup`
  (migration 043, chỉ local) và CHECK với sổ; `--check-field-targets` khoá tên trường FIELD_TARGET (G3) theo
  `canonical.fields`.
- Nạp lại không xoá (PL14, `_acceptance/nap-lai-khong-xoa`, migration 044): `sale_offers`/`listings` là VIEW sống
  (`retired_at IS NULL`) trên bảng bản ghi `sale_offer_records`/`listing_records` — chỗ đọc không đổi, chỉ đường ghi biết
  bảng bản ghi. Tin vắng lượt nghỉ (`het_trong_luot`/`doi_khoa`), listing ngoài phường nghỉ (`ngoai_phuong`); không câu
  DELETE/TRUNCATE nào nhắm hai bảng (bộ quét `pipeline/lib/scan-delete.mjs`). `reconcile_stale_offers` bản 044 chuyển đề
  xuất enrich, thẻ `enrich:`/`pair:`, `property_offers`, ứng viên ghép đã quyết sang tin kế (`superseded_by`); 6 khoá ngoại
  tới hai bảng là RESTRICT. Khoá S03/S05 «dính» (`pipeline/lib/offer-key.mjs`): nhóm repost thừa kế `offer_id` của tin
  chung nhiều post nhất, nhóm mới băm `'<S0x>|<post neo>'`; `originating_system_key` (RESO) cho S03/S05/S06 và listing.
- Gộp trùng S03 vừa tay (`_acceptance/s03-gop-trung-dung`, 27/10): khoá gom repost (`repostKey`, transform-zalo bước 4)
  thiếu phường hoặc diện tích thì thêm người đăng (`sender_id` → SĐT → chữ bài chuẩn hoá) — DB local 349 → 586 tin S03,
  nhóm lớn nhất 177 → 115 bài, đối soát không cho nghỉ tin nào. «Luồng 7 ngày qua» đếm «S03 — bài nhận» bằng đúng tập
  `loadStgPosts` + `testMarker`, cột «S03 — tin rao mới». S05 cùng công thức khoá — chưa đổi.
- Cầm máu số liệu S03 (N1 `_acceptance/s03-cam-mau-so-lieu`, 30/10): `parsePost` đọc số trên chữ đã gạt URL và SĐT (`gatSo`),
  luật giá môi giới («2.650 tỷ» = 2,65 tỷ, «2400 tỷ thu về» = 2,4 tỷ, «2ty450», «5tr5», «7.000.000», «Giá: 4,000» tin bán),
  DT «64m» (15–500, chặn bề ngang); số đếm sau chữ tỷ («8 tỷ 4 tầng») không thành phần lẻ, đơn giá «45.000.000/m2» ra giá/m²; bài thuê từ 1 tỷ / bán trên 100 tỷ không thành tin (`lyDoGiaPhiLy`, đếm theo lý do);
  khoá gom thiếu phường/DT thêm mã toà/căn (`maToaCan`); `seller_name` = tên bài mới nhất; phường theo `market_codes` của
  nhóm, nhóm chưa khai đối chiếu mọi thị trường có phường, tên trùng hai nơi ra null. DB thử: 0 tin thuê ≥ 1 tỷ (từ 41),
  0 bán > 100 tỷ (từ 94), 0 giá từ URL (từ 4), `seller_name` 96,9% (từ 0), 0 tin TP.HCM sai phường (từ 38).
  Listing Airbnb transform cho nghỉ ngoài phường mang toạ độ của lần thu mới nhất (thiếu → NULL), giữ mốc + lý do nghỉ cũ
  (`_acceptance/airbnb-nghi-khong-hoi-sinh`) — reassign-areas chỉ đánh thức listing nghỉ khi toạ độ HIỆN HÀNH vào phường.
- Phát biểu + phân xử (PL15, `_acceptance/phat-bieu-va-phan-xu`, migration 045): bảng chỉ-thêm `field_assertions`
  (RESO extension `FieldAssertion`, chủ thể = khoá gốc từng post/list_id); hàm `resolve_offer_fields` dựng năm cột
  `property_type`/`bedrooms`/`bathrooms`/`street_raw`/`block_raw` theo ba lớp căn cứ (sự thật › quan sát có trích dẫn ›
  suy luận; thứ tự tạm trong lớp hitl › trường nguồn; parser › E1 › E2 › legacy — Mạnh đồng ý 26/10) kèm
  `field_provenance`; suy luận không vào cột. Hết fill-gap và `ENRICH_COLS`; người (`hitl:`) thắng mọi phương pháp.
  Cổng «chưa cắt chuyển» chặn phân xử tới khi `pipeline/phat-bieu-cat-chuyen.mjs` ghi giá trị có sẵn thành phát biểu
  `legacy` (runtime-map «Phát biểu + phân xử»). Chỉ local.
  Thước `pipeline/scripts/nap-lai-ba-luot.mjs` (ba lượt, ma trận 7×2, đối chứng 039 / không chuyển). sync-cloud chép view
  sống, bảng con chỉ dòng có cha sống; cột mới ở lại máy.
- DATA-CONTRACT v1–2: importer nhận cả hai; ảnh Zalo N1 (`meta.mediaFiles`) →
  `stg_zalo_posts.media_files` (migration 035, PII tầng A — chỉ local, test
  `pipeline/sync-pii.test.mjs` gác FILL). Transform/`/ops` chưa đọc cột này.
- S08 (danh mục căn, PL10): `stg_s08_inventory` (migration 040) — một dòng = một căn ở một snapshot
  (khoá `source_id` + `snapshot_id`, `state` notSold/sold), chỉ local (test `sync-pii` + leak gate gác);
  ánh xạ RESO ở `mappings.yaml` `sources.S08`. Chờ importer DATA-CONTRACT v4 của ZCode; chưa có transform.
- Cloud sync (15', `pipeline/sync-cloud.mjs`): nguyên tử từ cloud-sync-atomic (23/10) — nạp
  `sync_stage.rows` (migration 038, schema riêng, anon không đọc được) qua Management API rồi MỘT giao
  dịch DELETE+UPSERT+INSERT; không TRUNCATE (giữ `saved_markets`); đọc local `row_to_json` một snapshot
  (ngày/micro-giây/số jsonb nguyên vẹn); chặn tụt 50% (`sellers` được co khi audit
  `bait-gap:sellers-orphan` ≤24h khớp số dòng — PL2); bảng người bán theo `CLOUD_ALLOW`, `seller_ref`
  → `S0x:<số>`, soát tên nguồn trước khi gửi. Thước `pipeline/scripts/check-cloud-sync.mjs <ca>`,
  máy đo prod chỉ đọc `cloud-sync-watch.mjs`; triển khai: `docs/ops/cloud-sync-atomic.md`.
  Tệp chạy `scripts/cloud-sync.sh` thoát ≠ 0 khi `sync-cloud` hay `push-ops-facts` hỏng (dòng `JOB FAIL [cloud-sync]`,
  hai bước vẫn chạy cả hai); `push-ops-facts` theo `DATABASE_URL` — AU13 `cloud-sync-bao-loi-that` (24/10).
- Nhãn nguồn ở Ops (ON7 `ops-nhan-ma-nguon`, 24/10): ngoài `/ops/sources`, chữ hiển thị chỉ «S0x · vai trò»
  (`sourceLabel` trong `app/src/lib/source-labels.ts`, vai trò từ `source_registry` / `facts.sourceRuns`); nhãn, id và
  dòng log cuối của job (local lẫn payload facts) không còn tên thật — bộ che `mask-source-names` đóng chặt khi không đọc
  được tên. Thước: mục 12 `check-portal-compliance` (quét chữ hiển thị + ma trận viết trước) và HTML/payload thật.
- Một bộ soát tầng A cho mọi đường lên cloud (NT2 `soat-tang-a-moi-duong-len-cloud`, 24/10): `pipeline/lib/tier-a-guard.mjs`
  dùng chung cho `sync-cloud` và `push-ops-facts`; bản tin còn tên thật thì không gửi (`FACTS CHẶN [tầng A] <đường> <S0x>`,
  soi khô `--kho`), tên tài khoản thu gửi `null`; leak gate đỏ khi bảng người bán ở cloud có cột ngoài `CLOUD_ALLOW` hoặc
  bảng tầng A có dòng (soi prod `sync-cloud.mjs --kiem-cot`). Vận hành: `docs/ops/runtime-map.md`.
- Số tổng hợp Ops lên cloud (ON22 `ops-facts-so-tong-hop`, 24/10, ADR-0014): `push-ops-facts` đẩy thêm năm khối có
  `measured_at` — độ tươi, job launchd, lockdown từng lớp, bản ghi 24h, số thẻ chờ (`scripts/lib/ops-local.mjs`, khớp hàm
  app bằng phép đo đối chiếu); khối đo không được ghi `error`; cloud đọc qua `readOpsFacts()` (none/fresh/stale, 45′).
- Ô KPI Ops trên cloud (ON3 `o-kpi-chi-do-local`, 24/10): `/ops`, `/ops/collections`, `/ops/review` trên cloud đọc số
  máy local đẩy (`getCloudOpsView`), kèm «Số đo lúc … (GMT+7) từ máy local»; số cũ quá 45′ có Alert vàng và không badge
  xanh; chưa có bản tin thì «—» + một Alert «Chỉ đo ở máy local». Lockdown trên cloud chờ ON23.
- Khoá an toàn trên máy chủ (ON23 `lockdown-cloud-theo-facts`, 25/10): ô và lưới «Khoá an toàn & hạ tầng thu» đọc khối
  `lockdown` máy thu đẩy lên; chưa có số (hay khối lỗi) thì 8/8 lớp «Chỉ kiểm ở máy thu», không lớp nào xanh; Kev gate và
  collector API ở Máy móc lấy trạng thái từ cùng khối nên luôn khớp Khoá an toàn (OPS-3).
- Nhóm S03 trên máy chủ (ON4 `nhom-s03-tren-cloud`, 25/10): bản tin mang khối `s03` (N nhóm bật + số đếm từng nhóm, chỉ tên
  nhóm); bảng nhóm S03 dựng trên máy chủ, cũ thì «Hoạt động» viền xám, chưa có khối thì ở lại Alert gom. «Vào bảng thô» theo
  nhóm nay đúng ở bản tin (trước luôn 0); N đếm theo nhóm hiệu dụng mọi tài khoản (máy thu 7, không còn 4) — OPS-9.
- Độ phủ API trên máy chủ (AU12 `coverage-cloud-got-tang-a`, 25/10): `GET /api/v1/ops/coverage` trên máy chủ đọc khối
  `freshness` máy thu đẩy lên, trả cờ `state` tươi / cũ / không số; không số thì `rows: null` + «Chỉ đo ở máy thu» (trước
  trả `[]` như thể không nguồn nào); phản hồi chỉ trường độ tươi, không tên nguồn thật.
- Supabase khoá anon + RLS (migration 037, PR #20, merge ce4ad81): thu quyền anon/authenticated, bật RLS
  (không FORCE) trên bảng public — app/data-api/sync chạy bằng role chủ/BYPASSRLS nên không đổi. **Đã merge,
  CHƯA áp cloud** — Mạnh áp theo `docs/ops/supabase-lock-anon-rls.md`.

### 2.3 Nguồn (source_registry + /ops/collections feed health)
Đo 26/10 trên máy thu (`source_registry`, `launchctl list`, `airdna_markets`). Trạng thái theo vòng đời năm giá trị
`draft · active · paused · retired · completed` (CHECK từ 047, TV2a); script thu hỏi «có được thu» qua `isRunnable` (TV2b).
Mọi đơn vị thu (nhóm S03/S05, vùng S06, market S02) nằm ở MỘT sổ `collection_units` có mã `S0x-[NVM]ddd`, thị trường,
dự án (048, PL12); tên cũ `source_groups` là view gồm mọi dòng. S03 (bản soi gateway, chỉ đọc) và S02 vào sổ bằng
`node pipeline/sync-don-vi.mjs` chạy tay ở máy thu; khai thị trường, dự án ở khu «Sổ đơn vị thu» trên `/ops/sources`.
Văn xuôi gọi nguồn bằng mã + vai trò,
không thêm tên nguồn thật (ADR-0007 sửa đổi 26/10); nhãn job, tên bảng, tên tệp giữ nguyên như trong kho. Bảng giải mã
ở `/ops/sources` của máy thu.

| Mã · vai trò | Trạng thái (`source_registry`) | Lịch thật | Ghi chú |
|---|---|---|---|
| S01 · Tự thu ngắn hạn | active | thu **tuần**: CN 19:30 (`collector`, có jitter); 20:00 hằng ngày chỉ là **smoke** (1 trang kiểm selector, `smoke`) — không phải discovery | |
| S02 · Hiệu chuẩn | active | 19:05 hằng ngày (`airdna-daily`), xoay vòng **43 market** trong `airdna_markets` (transform tự thêm market mới) — không phải «34 tỉnh» | chỉ `/ops/quality` (luật 5) |
| S03 · Cộng đồng | active | gateway nhận liên tục; nạp 00:00 (`zalo-import`); tín hiệu sống 15′; bộ canh 5′ | media CHỜ tin ảnh (dbg-media) |
| S04 · Địa giới mở | completed | một lần, chạy tay | |
| S05 · Mạng xã hội | paused | job vẫn chạy 00/06/12/18h (`apify-facebook`) — `paused` hôm nay chỉ tắt đo độ tươi, chưa script nào tuân (G1, TV2b) | Mạnh chốt 24/10: nhà cung cấp trả 402 hết credit từ ~21/10, chờ reset 7/11; 118 offers giữ |
| S06 · Rao vặt công khai | active | 05:30 (`chotot`: collect → import → transform → refresh → resolve) | ruler 150 phường; phone reveal chưa làm |
| S07 · Cổng rao | không có dòng | — | chưa có collector; tự build nếu cần |
| S08 · Danh mục dự án | paused | — | chưa có collector, `stg_s08_inventory` 0 dòng; ≤ 1 lần/tuần, chỉ nội bộ (luật 5) |

### 2.4 Chạy đêm (launchd)
Đo `launchctl list` 26/10 — 12 nhãn đang nạp.
- **Theo giờ**: 19:05 S02 (`airdna-daily`) · CN 19:30 S01 tuần (`collector`) · 20:00 smoke S01 (`smoke`) · 00:00 nạp S03
  (`zalo-import`) · 00/06/12/18h S05 (`apify-facebook`) · 05:30 S06 (`chotot`).
- **Theo nhịp**: 15′ cloud-sync + ops-facts (`cloud-sync`) · 15′ tín hiệu sống S03 (`zalo-heartbeat`) · 5′ bộ canh
  (`zalo-watchdog`).
- **Chạy liên tục** (KeepAlive): `kev-gate` :8009 · `collector-api` (đã chạy dưới launchd) · gateway OpenClaw.
- **Không chạy dưới launchd**: backup (V1); `com.oneinvest.kev.plist` có tệp nhưng không nạp (`kev-gate` thay).

### 2.5 Số liệu hôm nay
> ⚠ 23/10: 1.020/1.102 tin S03 trong `sale_offers` sinh từ snapshot giả `zalo-mock` (chỉ 82 tin thật) — số P1,
> sellers, bait gap dưới đây gồm cả tin giả. Xem `docs/architecture/classification-enrich-review.md` §0.3 (L19).
> PL2 (`_acceptance/canonical-khong-tin-gia`): transform gạt post thử, lượt 00:00 đầu sau merge rút tin giả qua
> đối soát + xoá người bán mồ côi; đo bằng `cd pipeline && node scripts/test-data-residue.mjs` (mô phỏng 23/10:
> 1.023 tin giả · 153 bait gap · 988 người bán → 0).
1.195 P1 + 8.647 P2 offers · 8.270 properties (gộp 375 repost) ·
ruler 150/338 phường · 1.043 sellers · 237 candidates P1↔P2 ·
506 listings (493 ảnh, tên host thật) · G3 live 2 thị trường.

### 2.6 Chuẩn UI/UX ReUI (A) — nhánh `feat/ui-standards-reui`
Thiết kế: `docs/superpowers/specs/2026-10-22-ui-ux-standards-design.md`.
- Skill `reui` (`.claude/skills/reui/`, vendor do installer quản lý, khối luật trong AGENTS.md) + MCP `reui`.
- Skill `onehub-ui` (`.claude/skills/onehub-ui/`): route map máy kiểm, danh mục block/component
  (`catalog.md`), màu dữ liệu, chữ VN, vòng làm việc. `app/DESIGN_RULES.md` thu lại thành con trỏ.
- Lint `onehub-ui` (`app/eslint-plugin-onehub-ui`): 10 luật; baseline `app/eslint-suppressions.json`
  = 138 vi phạm / 31 file, chỉ được giảm (B1–B5 dọn dần).
- CI job `ui-lint` (`.github/workflows/ui-lint.yml`) + hook Stop lint file UI vừa đổi.
- Rule `.claude/rules/ui.md` (tự nạp khi chạm `app/src/components|app`); ổ cắm kit
  `_acceptance/config.yaml`: `feature_loop.ui_standards_skill` và `design_pass.ds_skill` = `onehub-ui`.
- **B1 Cổng Ops** (nhánh `claude/ui-clean-b1-ops-c5a53a`): shell riêng `components/shell/ops-shell/`
  (chuyển thể `app-shell-36`, nav nhóm trong `shell/nav.tsx` có `/ops/review`); `/ops` = solution-dev-ops-5,
  `/ops/collections` = solution-dev-ops-6 + lưới job dev-ops-1, `/ops/sources` = solution-ai-ops-2 + lưới
  dev-ops-6, `/ops/quality` giữ `StatTiles`/`InsightGrid`, `/ops/design` thành trang trưng bày. Harness
  kiểm máy `scripts/ui-standards/b1-ops.mjs`; che chữ tầng A khi chụp `scripts/ui-standards/mask-tier-a.js`.

## 3. QUYẾT ĐỊNH ĐÃ CHỐT (không hỏi lại)

1. **kind ↔ RESO**: sale≈Residential*; rent_lt≈ResidentialLease+Monthly;
   STR (rent_st)=local extension. BusinessType(109 ngành nghề) ≠ bán-vs-thuê.
2. **property_type**: apartment|house|land|room(VN ext)|commercial|unknown.
3. **Monorepo**: private + subtree/overlay public (tools/sync-public).
4. **Agent = onehub-ai-agent** (thư mục agent/; 2 vai pipeline+advisor).
5. **KIẾN TRÚC AGENT** — harness "3 tầng + 1 hợp đồng": TS + Vercel AI
   SDK; runtime loop (ReAct + step budget + hooks + trace JSONL); tools
   MCP-first; agents-as-config; KHÔNG LangGraph; kev-serve gọi qua HTTP.
   Hợp đồng: questions[] typed + MCP + audit. → agent-harness-survey.md.
6. **MEMORY AGENT** — Postgres-first 3 lớp: episodic (user_events) →
   semantic bi-temporal (user_profile + source+evidence + consolidation
   đêm Qwen local) → procedural (sau); memory là TOOL của runtime; KHÔNG
   graph/vector trước nhu cầu; PII tầng A + user-owned export.
   → agent-memory-survey.md.
7. **Làm tốt từng nguồn trước**; FB/BDS khả thi nhưng là bài toán chi phí.
8. **Decision models**: Kev-4B gate chính (local); upgrade kev-9b cùng
   repo; Laya loại (OOD); OpenAI Decisions chỉ phi-PII.
9. **Hai agent, hai làn** (22/10): ZCode = thu thập (nguồn → raw → `stg_*`),
   Claude Code = phần còn lại + cổng tích hợp (review, `/verify`, `_acceptance`,
   merge). Ranh giới = DATA-CONTRACT; mỗi bên một worktree, checkout chính giữ
   `main`. Chi tiết: AGENTS.md "Phân làn hai agent" + `collector/AGENTS.md`.
10. **Cổng Ops đóng mặc định** (22/10): vào `/ops/**` khi `users.role` ∈
   {`ops`, `admin`} hoặc email trong `OPS_EMAILS`; đăng nhập thôi không đủ
   (`/register` mở). Cấp quyền data-ops bằng `role = 'ops'`, không cần migration.
11. **Người bán là công khai** (23/10): tên, SĐT, ID tài khoản người bán trên tin
   rao là tầng C (hoạt động bán hàng/môi giới), không phải lộ danh tính. Tầng A còn:
   tên nguồn thật, hồ sơ người dùng app. Sửa đổi ADR-0007 mục 9.
12. **Người chỉ đứng ở cổng, không ở từng lệnh** (23/10): bỏ luật ask rộng `git push *` /
   `vercel *` / `npx vercel *` (giữ ask `supabase db push`, `sync-public`); rào push main chuyển
   sang branch protection GitHub (PR bắt buộc, check `gate` + `ui-lint`, admin không vượt, cấm
   force-push) như crm/kit. Làn merge dùng `gh pr merge`. Hồ sơ `_acceptance/narrow-ask-rules`.
13. **Framing** (23/10, `docs/product/FRAMING.md` §2.0): mạng lưới listing tin cậy, **gom vào** (không
   đăng hộ ra kênh khác), OneHub Invest là nơi hiển thị; căn gốc = số nhà / mã căn. D1 dùng/mua danh mục dự
   án · toà · mã căn · D2 người dùng đầu tiên là chính đội (vừa đầu tư vừa môi giới) · D3 căn hộ trước, môi
   giới giữ mã căn · D4 tin P1 hiện công khai, trao đổi tức thời (độ tươi tính bằng phút) · D5 thuê người gắn
   nhãn/duyệt được, nhưng model phải gánh tối đa.
   **Dữ liệu là nỗ lực liên tục, có cấp bậc**: thang căn B0–B5 (lời khai → đọc được → gắn căn → đã đo → xác
   minh → sống), năng lực phân khúc N0–N4; north star = phân bố căn theo bậc; bậc đích: căn hộ có danh mục B5,
   nhà phố B3, Chợ Tốt B3 (FRAMING §3.4).
14. **Tên nhóm là công khai, tên nguồn vẫn bí mật** (24/10, audit Ops prod OPS-6/OPS-13): tên nhóm cộng đồng
   mà S03 thu là tầng C — hiện trên `/ops/**` ở cloud, đi qua `ops_heartbeat`, làm ngữ cảnh cho agent; tên nguồn
   thật vẫn tầng A, ngoài `/ops/sources` chỉ mã `S0x` + vai trò. Tên tài khoản thu chưa chốt. Sửa đổi ADR-0007.
15. **S08 như nguồn hiệu chuẩn** (24/10): chỉ đọc, ≤ 1 lần/tuần, chỉ nội bộ, không tái xuất lên cổng công khai
   (AGENTS.md cạnh luật 5).
16. **Ops trên cloud đọc số tổng hợp do máy local tính sẵn** (24/10, «Chọn A», ADR-0014): `push-ops-facts.mjs` đẩy
   độ tươi/SLO, job, lockdown, bản ghi 24h, số thẻ chờ (chỉ tổng hợp + mã `S0x`, qua bộ soát tầng A), mỗi khối có mốc
   đo; trang cloud chỉ đọc bảng đó, facts cũ > 45′ báo «máy local không đẩy số». Loại sync bản gọt và tunnel.
17. **Kiến trúc dữ liệu «tin → căn» theo RESO DD 2.1** (23/10, **ADR-0013**): căn = UPI + `Building`, tin = `Property`;
   toà = `BuildingName`, phân khu = `ComplexName`, trục = extension `Stack`; UPI kiểu VN `urn:onehub:upi`; phường/xã →
   `City`; mọi giá trị máy/người ghi `FieldAssertion`; trạng thái chỉ theo bằng chứng. Mọi việc chạm dữ liệu tin/căn
   kiểm 8 câu «Luật cho mọi việc sau» của ADR-0013.
18. **Ops tự vận hành nguồn kiểu SaaS** (25/10, `docs/research/ops-tu-van-hanh-nguon-saas.md`): đội vận hành làm **từ xa trên cổng Ops ở
   cloud** — cloud ghi lệnh có khuôn, máy thu kéo về, kiểm bất biến, áp, tự hoàn tác (**ADR-0015**, 26/10);
   **nội dung bài, ảnh tin rao, thẻ duyệt lên cloud không che** cho vai ops trở lên, **tên nguồn thật chỉ ở máy thu**
   (cloud `S08`, local `S08-<tên>`) — **ADR-0007 sửa đổi 26/10** (luật 6); tám quyết định §4.8 (S03 cần người thứ hai duyệt ·
   QR ở lại máy thu · ảnh thu nhỏ, trần 5 GB · S05 tự paused, admin bật lại · quy định AI chạy model local · mã đơn vị
   `S03-N012` · tên thật trong migration cũ chấp nhận như lịch sử). Đợt lộ trình `tu-van-hanh-2510`.
19. **Lát dọc Ocean Park 1** (26/10, Mạnh duyệt gói lát OCP1 «Hỏi-1..7: theo khuyến nghị», `classification-enrich-review.md`
   §7.0): Q2/Q3/Q5/Q11 theo §0.2 F (khoá tin gốc + phát biểu `căn`; bảng phát biểu + phân xử; chỉ tự áp ô đã đo; đo trong
   lát dọc) · lát đầu = OCP1 · Q4/Q9 (ngữ cảnh nhóm chỉ suy luận; thẻ duyệt không hiện độ tự tin) · M1 = model local mặc
   định, cloud khi số đo cho thấy local không đủ; M3 hoãn tới PH4 · Mạnh và đội gắn nhãn khi PL7 xong · chạy F6 · L0 theo thứ
   tự ZC6 → ZC4 → hook Kev v3. Kèm: **PL3 gộp vào PL23**; **`pipeline/mappings.yaml` là nguồn danh sách trường duy nhất**;
   C2–C4 cắt cùng lúc, phần UI của PL9 gộp vào C4.

20. **Kho tri thức riêng tư đi kèm** (26/10, Mạnh duyệt «đặt tên là onehub-invest-tri-thuc để phân biệt với các kho khác
   và duyệt theo khuyến nghị»): `phanlemanh/onehub-invest-tri-thuc` chỉ phục vụ onehub-invest; khai `tri_thuc` với
   `cong_khai: true` và `kho` — tài liệu thô và trang tóm đều ở kho riêng, kho công khai chỉ giữ đường trỏ băm. Kho riêng
   vẫn nằm trên GitHub nên tầng A (luật 6) không vào; nguồn ngoài kho công khai được che tên nguồn bằng mã S0x trước khi
   ghi. Gói `tri-thuc` cài scope local (không chạm `.claude/settings.json`). Đủ 10 bản phạm vi đổi `nguon` sang trang đợt.
21. **«Listing» là mọi tin niêm yết, theo RESO** (27/10, Mạnh chốt hướng B — thay bản đầu cùng ngày «listing chỉ là thuê
   ngắn hạn»; `docs/audit/2026-10-27-tu-ngu-tin-listing.md`): listing = resource `Property` (bán · thuê dài hạn · thuê ngắn
   hạn); dịch vụ ở `kind` (`sale` · `rent_lt` · `rent_st`), loại hình ở `property_type`; nhiều listing trỏ về một căn (UPI).
   Tin rao = listing bán + thuê dài hạn; listing thuê ngắn hạn = Airbnb tự thu (lịch đêm, ADR là extension). Trục
   `listing_intent` giữ tên; giá trị `wanted` → `inquiry` «Yêu cầu» (Mạnh 27/10; yêu cầu là bên mua, đối xứng
   với listing bên bán; loại con Yêu cầu mua / Yêu cầu thuê theo `kind`; migration 050). Hai bảng `sale_offers` + `listings`
   gộp về một khái niệm listing (đổi tên bảng, nhãn UI «Listing» đang chỉ Airbnb) ở hàng tái cấu trúc riêng, khi các dãy
   khép. Chữ prompt LLM chỉ đổi khi có bench.
22. **Danh bạ vật thể và người** (27/10, Mạnh duyệt «khung đã sửa ba điểm, theo các mặc định»; **ADR-0016**, sửa ADR-0013
   §1/§3/§9): bốn họ danh bạ — Vùng (`areas`, `asset_nodes` khu đô thị/phân khu; «thị trường» là tên cấp vùng, không phải
   danh bạ) · Vật thể (thửa · toà · trục · căn, mỗi cấp một bảng chung khung khoá mờ/bí danh/gộp-tách/phát biểu) · Người
   (vai trò là quan hệ có phát biểu; vai suy luận chỉ ở `/ops`; không thu chủ sở hữu ngoài tin) · Listing. «Một Căn Nhà» =
   nút vật thể listing gắn vào, ở mức sâu nhất biết được; UPI neo toà hoặc thửa, đúc một lần. Kế thừa hai chiều theo năm
   luật (chỉ trường thuộc vật thể, không đè, không tự nuôi, mâu thuẫn ra thẻ, rút dây chuyền). Nhà phố/đất: một vật thể tạm
   mỗi tin, gộp theo bằng chứng — toạ độ S06 chỉ là tín hiệu phụ. S08: vật thể chỉ-S08 ở local, giá trị chỉ-S08 không lên
   Invest. Hàng code thay PL11, PL24 và thêm hàng Người — giám sát cắt vào lộ trình.
23. **Quỹ hàng là sản phẩm SaaS riêng** (29/10, Mạnh chốt «Chốt app riêng» và «Chốt, viết ADR»; **ADR-0017**): ứng dụng
   quản lý hàng cho sàn môi giới, phía cung của Platform, **không phải cổng thứ ba** của Invest — `app/` không có route nào
   của nó; kho riêng tư `onehub-quy-hang`, cơ sở dữ liệu riêng. Nguyên tắc SaaS: cơ chế ở kiến trúc, mỗi kết nối là một
   thoả thuận bật/tắt, chỉ mở tới trần của lớp dữ liệu (thông tin chủ nhà không bao giờ rời công ty). Invest → Quỹ hàng là
   thoả thuận đầu tiên, một chiều, Invest đẩy theo mẫu ADR-0014: danh mục căn, số thị trường tổng hợp, tin rao đã khớp căn
   — không S08, không AirDNA, không tên nguồn hay đường dẫn bài gốc; bộ soát chạy ở cửa ra của Invest. Chiều ngược tắt,
   mở bằng thoả thuận và qua cửa kiểm của Invest. Việc ở kho này: một bước đẩy nguồn cấp ở `pipeline/`, làm sau.

## 4. LỘ TRÌNH THỐNG NHẤT

> Từ 23/10 việc sắp làm và mốc nằm ở `docs/plan/lo-trinh.json` (đợt `phan-loai-2310` PL1–PL31, `cam-mau-2310`
> AU1–AU12; lượt cắt chung 23/10 thêm `giao-dien-2310` UI1–UI17, `nen-tang-2310` NT1–NT7, `zcode-2310` ZC1–ZC5,
> `san-pham-sau-2310` chờ điều kiện SH1–SH14; bối cảnh `docs/plan/BOI-CANH.md`). Các bảng track dưới đây là chỉ mục
> lịch sử; đồng bộ với lộ trình ở hàng AU8.

### Track 1 — AGENT (onehub-ai-agent) — chốt, sẵn sàng thực hiện
| # | Việc | Trạng thái |
|---|---|---|
| A1 | runtime/ loop TS (AI SDK) + trace JSONL | ✅ 1fd762e |
| A2 | judge-entity eval 3 cặp (prefetch, không tool) — cần hand-label | 🔶 5440759 |
| A3 | MCP server tools (gom C3-wrap + data-api) | ⬜ |
| A4 | extract-text fallback (coverage 44-65% → tăng) | ⬜ |
| A5 | evals suite agents (pattern kev 620 mẫu) | ⬜ |
| A6 | advisor + compaction (chỉ khi agent dài xuất hiện) | ⬜ hoãn có chủ đích |
| M1 | migration user_events + user_profile + seed (saved/G3) | ✅ 8422289 |
| M2 | memory tool + wire app events (view_market + dau_tu_input) | ✅ 8422289 |
| M3 | consolidation đêm (Qwen local, source+evidence) | ⬜ |
| M4 | form hồ sơ + export JSON (consent, user-owned) | ⬜ |
| M5 | pgvector — chỉ khi đo thấy cần | ⬜ kháng cự |
| HITL | /ops/review Review Queue (12 entity_match seeded) | ✅ c6eea64 |
| M-3 | enrich qua đề xuất: `enrichment_proposals` (033) + luật xác định + thẻ `agent_output` /ops/review; E1 trái LLM → thẻ đối chiếu chọn một bên | ✅ PR #14 (`_acceptance/enrich-qua-de-xuat/`) |
| M-3b | hậu kỳ enrich: đề xuất sống qua nạp lại (039 + `writeOffers`, khoá ngoại RESTRICT) · hoàn tác có audit (036 + `enrich-revert`) · E1 không suy land từ tên nhóm | 🔶 chờ Cổng Bằng chứng (`_acceptance/enrich-hau-ky/`); sau merge: áp 036 → 039 lên DB local TRƯỚC lượt nạp đêm kế, rồi hoàn tác 639/644 (Hỏi-2) |
| R-PL | Review kiến trúc phân loại + enrich (`docs/architecture/classification-enrich-review.md`, khung `docs/product/FRAMING.md`): sổ 20 lỗi (L01–L20), kiến trúc đích, việc theo làn; khung RESO ở ADR-0013 | 🔶 FRAMING đã duyệt; chờ Mạnh quyết Q2–Q12 (Q1 Kev thành nhãn đã chốt) |

### Track 2 — "Một Căn Nhà" hoàn thiện
| # | Việc | Trạng thái |
|---|---|---|
| G-1 | property_type + DQ + asset_nodes R1 | ✅ 3313a9c |
| G-2 | properties + ruler dedup + candidates | ✅ 50005b7 |
| G-2.5 | pHash ảnh — khi ảnh P1 nhiều hơn | ⬜ |
| PL6 | Sổ từ vựng một nguồn (mappings.yaml → hằng + CONTEXT.md + `ref_*`; lint enum viết tay; VALIDATE CHECK 025) — `_acceptance/so-tu-vung-mot-nguon` | ✅ PR #120 (migration 043 đã áp local; Supabase đã áp 26/10 — `docs/ops/cloud-schema-catchup-2026-10-26-043.sql`) |
| PL14 | Nạp lại không xoá: bảng bản ghi + view sống (lối A, 044), khoá dính S03/S05, tin/listing nghỉ (`retired_at`) thay DELETE, 6 khoá ngoại RESTRICT, đối soát chuyển quyết định sang tin kế — `_acceptance/nap-lai-khong-xoa` | 🔶 vòng S4; sau merge: áp 044 lên DB local NGAY (launchd chạy code main); cloud không đổi lược đồ (`docs/ops/cloud-schema-catchup-2026-10-26.md`) |
| PL15 | Bảng phát biểu chỉ-thêm + bộ phân xử ba lớp dựng năm cột phân loại kèm nguồn gốc, chạy lại ra y nguyên (045) — `_acceptance/phat-bieu-va-phan-xu` | 🔶 vòng S4; sau merge: áp 045 + `phat-bieu-cat-chuyen.mjs` trên DB local TRƯỚC lượt nạp đêm kế; cloud không đổi lược đồ |
| G-3 | Kev-V media gate + VLM collage + LLM judge (≡ A2) | ⬜ |
| R2-R4 | asset_nodes mở rộng (subzone/building; geo-polygon; dedup căn) | ⬜ |

### Track 3 — Nguồn thu
| # | Việc | Trạng thái |
|---|---|---|
| N1 | media Zalo: đọc dbg-media khi tin ảnh về → map → bỏ debug | ⏳ chờ dữ liệu |
| N2 | FB: Apify Starter (chốt 22/10) chưa có hiệu lực — vẫn 402 hết credit; S05 TẠM DỪNG từ 24/10 tới khi credit reset 7/11 (bật lại: `status=active` khi lượt thu chạy được) | ⏸ |
| N3 | AirDNA rotation (passive) | 🔄 sống |
| N4 | S06 phone reveal per-ad (cap 50/ngày, top-deals) | ⬜ |

### Track 4 — Sản phẩm
| # | Việc | Trạng thái |
|---|---|---|
| P-A | Deals v2 + G3 + ảnh/tên listing + ops panels | ✅ |
| P-A2 | Vá cổng: /deals → /ops/deals (SPL tầng A), gỡ AirDNA khỏi /dau-tu (luật 5) — chờ quyết gộp /dau-tu vào /yield | 🔄 nhánh fix/portal-deals-airdna |
| P-B | G4 khai thác sau mua (comps giá đêm — data sẵn) | ⬜ |
| P-A3 | Gỡ ảnh/chữ AirDNA khỏi /listing/[id] (luật 5) — chỉ ảnh tự thu, căn chưa thu PDP không ảnh | 🔄 nhánh fix/listing-airdna-photos |
| P-C | Advisor chat trên app (dựa A6+M4) | ⬜ xa |

### Track 5 — Vận hành
| # | Việc | Trạng thái |
|---|---|---|
| V1 | Backup tuần mã hoá (cần BACKUP_DIR+BACKUP_PASS từ user) | ⏳ nợ cũ nhất |
| V2 | sync-public sau mỗi milestone | 🔄 thủ công |
| V3 | Soak đêm tự động; soi /ops mỗi sáng | 🔄 |
| V4 | Siết quyền: cổng Ops đóng mặc định (role `ops`/`admin` hoặc `OPS_EMAILS`); `/api/zalo-media` chỉ ảnh trong `~/.openclaw/media` + `/tmp/openclaw` (realpath, không khớp tiền tố) — `_acceptance/ops-access-hardening` | ✅ Cổng 2 ký 23/10 — PR #5 (xếp chồng trên #3). Trước deploy: kiểm Vercel prod — user không phải admin cần `role='ops'` hoặc `OPS_EMAILS` |
| V5 | Tài khoản ops thử chỉ ở DB local (`scripts/dev-ops-account.mjs`) — máy tự đăng nhập dev để chụp/ui-check `/ops/**` | ✅ 2026-10-22 |
| V6 | Giảm hỏi quyền ngoài cổng: bỏ luật ask rộng, rào push main = branch protection GitHub (ngang crm/kit) — `_acceptance/narrow-ask-rules` | ✅ Cổng 2 ký 23/10 — PR #23; branch protection main bật 23/10 |
| V7 | Cloud sync nguyên tử — prod không còn cửa sổ trống, không xoá `saved_markets`, ngày đúng — `_acceptance/cloud-sync-atomic` | 🔄 PR #24 — Cổng 2 ký 23/10; migration 038 ĐÃ áp cloud 23/10; chờ merge |
| V9 | Tạm đóng `/api/v1/deals` — chỉ bearer `OPS_API_TOKEN` hoặc phiên ops; người gọi khác nhận 401 trước khi truy vấn. Lý do: audit 23/10 P7 (29/30 căn giá tốt trả công khai là tin mock S03), Q3 «đóng ngay, yêu cầu token ops». Mở lại khi PL2 đã rút tin mock khỏi canonical — quyết riêng, hàng riêng — `_acceptance/deals-api-tam-dong` | ✅ Cổng 2 ký 23/10 — PR #33; prod đo 23/10: khách 401, token ops 200 (`do-prod.md`). Project Vercel cũ `app` (`app-lilac-one-49.vercel.app`, bản 22/10) Mạnh đã xoá 24/10 — audit Q2 đóng (404 `DEPLOYMENT_NOT_FOUND`) |
| V10 | DB local tự khởi động lại sau khi Docker/máy khởi động lại — `restart: unless-stopped` trong `db/docker-compose.yml`, thước `scripts/check-db-autostart.sh` (AU7, audit L7) — `_acceptance/db-tu-khoi-dong` | 🔄 đợt 0 «Cầm máu»; xem `docs/ops/runtime-map.md` mục DB local tự khởi động |
| V12 | Sổ bề mặt API — mọi route khai ở `app/src/lib/api-surface.ts`, CI đỏ khi lệch; đóng `/api/v1/offers` (chế độ `ops` như căn giá tốt), beacon khách 204, `/api/zalo-media` chặn ảnh QR đăng nhập Zalo — `_acceptance/so-be-mat-api` | 🔄 NT4, đợt 0 |
| V8 | Khoá anon + bật RLS trên Supabase (037) — đóng lỗ PostgREST đọc được `users`/`sessions`/`sale_offers` bằng anon key — `_acceptance/supabase-lock-anon-rls` | ✅ merge PR #20 (ce4ad81); ⏳ CHƯA áp cloud — Mạnh áp theo `docs/ops/supabase-lock-anon-rls.md` |
| V13 | Luật tự vận hành từ xa: ADR-0015 đường lệnh kéo một chiều cloud → máy thu + ADR-0007 sửa đổi 26/10 (bài, ảnh, thẻ duyệt lên cloud cho vai ops; tầng A còn bốn thứ) + thuật ngữ Đơn vị thu, Lệnh, Quy định ngữ cảnh, Mục tiêu phủ — TV0 `_acceptance/adr-duong-lenh-keo` (T1) | ✅ Mạnh duyệt ADR 26/10; chờ gộp PR — cửa của TV1–TV14 |
| V14 | Tầng tri thức (kit 2.34.0): kho riêng `onehub-invest-tri-thuc` (12 raw, 2 trang nền, 10 trang đợt), `nguon` của 10 bản phạm vi là đường trỏ băm, 7 tệp kit `[only-if-declared: tri_thuc]` đã chép — `_acceptance/kho-tri-thuc-invest` (T2) | 🔄 chờ Cổng 2 |
| V15 | Vòng đời nguồn: `source_registry` + `source_groups` năm trạng thái có CHECK (paused bắt buộc lý do), `enabled` thành bản soi do trigger giữ khớp; `isRunnable` + CLI `pipeline/lib/vong-doi.mjs` cho TV2b — migration 047, TV2a `_acceptance/vong-doi-nguon` (T3) | 🔄 Cổng 2 Mạnh ký 26/10 — PR #129; 047 áp DB local SAU gộp |
| V16 | Sổ đơn vị thu: `source_groups` đổi tên `collection_units` (view tương thích gồm mọi dòng), mã đơn vị không cấp lại, thị trường + dự án nhóm chuyên (khu đô thị) kiểm bằng trigger; `pipeline/sync-don-vi.mjs` đưa S03 (chỉ đọc cấu hình gateway, nhóm biến mất → tạm dừng giữ mã) và S02 vào sổ; khu «Sổ đơn vị thu» + action `set-meta` (admin, audit cùng giao dịch) — migration 048, PL12 `_acceptance/so-nhom-mot-noi` (T3) | 🔄 Cổng 2 Mạnh ký 26/10 — PR #139; 048 áp DB local SAU gộp, rồi chạy `sync-don-vi` |
| V17 | Công tắc nhóm thu theo ma trận 5 × 2 của TV2a: không hồi sinh nhóm đã gỡ/đã xong qua tắt rồi bật (409 có chữ), tắt nhóm nháp/tạm dừng không đổi — `_acceptance/cong-tac-khong-ha-nhom-go` (T3) | 🔄 S4 chấm |
| V18 | Ca thử công tắc nhóm thu đối chứng với route trước sửa đã ghim (fixture), không đọc `origin/main` lúc chạy — vẫn xanh sau khi #142 gộp — `_acceptance/cong-tac-test-ghim-ban-cu` (T2) | 🔄 S4 chấm |
| V19 | Một bảng quyền bốn vai (viewer < ops < admin < owner) ở `app/src/lib/ops-access.ts` cho 11 route `/api/v1/ops/**`; route quản trị nhóm thu và Zalo chỉ admin, bearer chung chỉ đọc và nạp số; mỗi thao tác ghi đúng một dòng `ops_audit` mang `user:<id>`, cùng transaction; `users.role` CHECK (049, prod chờ Mạnh áp) — `_acceptance/quyen-bon-vai-mot-cho` (T3, TV1) | 🔄 S4 chấm |
| V20 | Vai viewer vào Ops nhưng không nhận nội dung tin: `xemNoiDungTin` (ops trở lên) ở `app/src/lib/ops-access.ts`; `/ops/review` cho viewer chỉ số thẻ chờ theo loại (không truy vấn cột nội dung), `/ops/data-flow` xoá bài gốc + tên nhóm trước khi gửi xuống trình duyệt; bảng kiểm kê 22 trang/route Ops; tài khoản thử `--vai viewer` — `_acceptance/viewer-khong-thay-the-duyet` (T3, Ngoài-9 của TV1). Định danh tài khoản thu ở `/ops/collections` để hàng riêng (P1-40): chưa cấp vai viewer cho người thật | 🔄 S4 chấm |
| V21 | Định danh tài khoản thu theo vai: `xemDinhDanhThu` (ops trở lên) ở `app/src/lib/ops-access.ts` + `cheDinhDanhThu` (giữ số dòng, mã về null) — `GET /api/v1/ops/collections` (thân ở `lib/collections-api.ts`) và trang `/ops/collections` che mã tài khoản, hồ sơ, mã nhóm, tài khoản giữ nhóm với Người xem và bearer chung, cả máy thu lẫn cloud; bản tin `push-ops-facts` gửi `soNhomBat` thay mã nhóm, `factsChan` chặn mã nhóm — `_acceptance/dinh-danh-tai-khoan-thu-theo-vai` (T3, Hỏi-1 của V20) | 🔄 S4 chấm |
| V22 | Cầm máu số liệu S03: transform-zalo đọc số không lẫn URL/SĐT, luật giá VN, DT «Nm», chặn giá phi lý, khoá gom có mã toà/căn, `seller_name`, phường theo thị trường của nhóm — `_acceptance/s03-cam-mau-so-lieu` (T2, N1) | 🔄 S4 chấm |
| V11 | Leak gate kiểm anon: sync cloud dừng đỏ khi anon/authenticated SELECT được quan hệ nào trong `public` (chừa 3 quan hệ PostGIS), kèm lệnh gỡ; `--kiem-anon` soi prod chỉ đọc (AU1, audit P12) — `_acceptance/leak-gate-kiem-anon` | 🔄 đợt 0; merge SAU khi Mạnh áp 037 và `--kiem-anon` trên prod sạch |

### Track 6 — Chuẩn UI/UX ReUI
| # | Việc | Trạng thái |
|---|---|---|
| A | Chuẩn: skill reui + onehub-ui, lint 10 luật + baseline, CI ui-lint, hook Stop, ổ cắm kit | ✅ (chờ Mạnh ký) |
| B1 | Cổng Ops (`/ops/**`): shell riêng `app-shell-36` + block Solutions (dev-ops-5/-6/-1, ai-ops-2; agents-5 cho `/ops/review`), primitive, AlertDialog, sonner, PageHeader + Frame — nhánh `claude/ui-clean-b1-ops-c5a53a`, hồ sơ `_acceptance/ui-clean-b1-ops/` (T2, Cổng Phạm vi + Cổng Bằng chứng đã ký 2026-10-23, S4 PASS 16/16 sau 3 lượt). Baseline 138 → 85 (sau B3). `/ops/review` (Task 12, agents-5 theo hướng (a)) TÁCH sang vòng sau — chờ backend ảnh tin vào main | 🔨 PR mở |
| B3 | Biểu đồ: bảng màu chung, gom code trùng, tách file > 200 dòng | ⏳ |
| BĐ | Bản đồ đích cổng Invest: block đích cho mọi route Invest (cột "Block đích" ở `onehub-ui/routes.md`, test chặn dòng thiếu), shell giữ `app-shell-30`, `/dau-tu` gộp vào `/yield`, slug đích tiếng Anh (cột "Slug đích"), bản đồ nguồn `mapcn`, bước tra Mobbin trong `loop.md` — `_acceptance/invest-target-map` | ✅ Mạnh chọn 23/10 (theo khuyến nghị) — chờ ký PR |
| I1 | Finder `/[country]`: `solution-analytics-1` + `@mapcn/choropleth`, PageHeader, trạng thái "đang thu thập" | ⏳ |
| I2 | Insight thị trường + phường: khung `solution-analytics-8`, giữ chart-6/chart-13/InsightGrid, bản đồ `@mapcn/map`, neo mục lục tiếng Anh | ⏳ |
| I3 | Listing: `/listing/[id]` `product-detail-5` (ảnh tự thu) · `/listings` product-grid-2 + `filters` + `@mapcn/store-locator` | ✅ `/listing/[id]`: hồ sơ `listing-detail-product-detail-5` (UI5) — đầu trang gallery ảnh tự thu (khung 3:2, ảnh dọc hiện trọn; một hàng ảnh nhỏ 1:1 trượt ngang; ảnh chết rời gallery) + hộp Đặc điểm, lịch form-5 hết nút tay/cỡ chữ 9px (baseline −3), KPI và Listing tương tự tải trong Suspense + lỗi tại vùng + Empty; quy định khung ảnh chung ghi ở `onehub-ui/catalog.md` «Ảnh (khung)» (Mạnh 25/10). `/listings`: hồ sơ `listings-filters-store-locator` (UI6) — một cây lọc cho thanh chip `@reui/filters` (màn rộng) và ngăn `filter-sidebar-5` (màn hẹp; điều kiện ngăn không chỉnh được giữ nguyên + báo), bốn trường Phường · Loại phòng · Phòng ngủ · Giá/đêm (Hỏi-5); bản đồ `@mapcn/map` theo khuôn store-locator (cụm + nhãn giá, popup «Xem listing», lọc lưới theo khung chỉ khi người dùng di chuyển); thẻ có ảnh tự thu 3:2; vùng Suspense + lỗi tại chỗ; registry `@mapcn` khai trong `components.json` |
| I4 | Lợi suất: `/yield` form-11 + `data-grid-advanced-7` (chi phí + dòng tiền vốn vay), `/dau-tu` → chuyển hướng `/yield` | 🟡 hồ sơ `yield-dong-tien-von-vay` (UI3) — mục «Dòng tiền vốn vay» `#financing` (chuyển thể chỉ đọc ở `yield/financing/`, mô hình trả góp đều `lib/financing.ts`), nhóm Vốn vay `eq`/`rate`/`term` trên form-11, `/<country>/<market>/dau-tu` → 301 `/yield?area=<market>#financing`, `/yield` suy thị trường từ mã phường; gỡ bộ mô phỏng cũ, baseline −16 |
| I5 | So sánh + Đã lưu: giữ comparison-1 / wishlist-2, thêm PageHeader + trạng thái; `/so-sanh` → `/compare` (301) | ⏳ |
| I6 | Trang chủ / Phương pháp (`faq-3`, `/phuong-phap` → `/methodology` 301) / Auth (giữ auth-4/5) | 🟡 trang chủ + Phương pháp: hồ sơ `trang-chu-methodology` (UI2) — `/methodology` faq-3 mở sẵn, nền hero/thẻ thị trường không màu cứng, `(marketing)/error.tsx` + `global-error.tsx`, baseline −18; auth giữ nguyên |
| B5 | Ops còn lại (`/ops/deals`) + gỡ baseline (phải rỗng) | ⏳ |

Cắt lại 23/10: B2 (khung & KPI) và B4 (trạng thái) không còn là đợt riêng — phần Invest của chúng đi
vào đợt nhóm trang I1–I6, mỗi đợt làm trọn khung + KPI + biểu đồ (bảng màu B3) + trạng thái; phần Ops
nằm ở B1/B5.

Phát hiện khi chụp bản đồ đích (chưa kiểm nguyên nhân, việc dữ liệu — chưa mở phiên): bản đồ Hà Nội ở Finder
và Insight mở ra cả nước vì ranh giới "phường" của `vn-hanoi` trải khắp VN (vùng tô gần Cần Thơ; bảng xếp hạng
có "Tỉnh Phú Thọ", "Tỉnh Hưng Yên"). Nghi gán khu vực/ranh giới ở pipeline (`reassign-areas.mjs`); mapcn không sửa được.

**Tích hợp nhánh fix/portal-deals-airdna sau A** (nhánh dời `(app)/deals/page.tsx` → `ops/deals/page.tsx`, sửa `dau-tu/page.tsx`, `investment-simulator.tsx`):
1. Rebase lên `main` đã có A.
2. `.claude/skills/onehub-ui/routes.md`: dòng `/deals` thành `/ops/deals` (file `ops/deals/page.tsx`, operational, Table-backed management, Frame); nếu không `routes-map.test.mjs` đỏ.
3. `app/eslint-suppressions.json`: đổi khoá `src/app/(app)/deals/page.tsx` thành `src/app/ops/deals/page.tsx`, giữ nguyên số đếm (hoặc `npx eslint . --prune-suppressions`), rồi kiểm bằng `node eslint-plugin-onehub-ui/check-baseline-growth.mjs <suppressions-của-main> eslint-suppressions.json`.
4. `cd app && npm run lint && npm run test:lint-rules` xanh.

**Thứ tự khuyến nghị tiếp**: A2 (judge 12 cặp qua /ops/review) → A4 (extract-text) → A3 (MCP) → M3 (consolidation).

## 5. Chỉ mục quyết định

ADR: 0001 stack · 0002 insight-core · 0003 collector · 0004 đa nguồn ·
0005 AirDNA hiệu chuẩn · 0006→0007 SPL+SOC · 0008 scope VN · 0009
boundaries · 0010 bán dài hạn · 0011 RESO-first · 0012 onehub-ai-agent ·
0013 tin → căn RESO · 0014 Ops cloud đọc số tổng hợp · 0015 đường lệnh kéo một chiều ·
0016 danh bạ vật thể và người · 0017 Quỹ hàng SaaS riêng, kết nối một chiều có thoả thuận.
Research nền: investment-pipeline-4-stages (north star) ·
unified-property-pipeline · decision-models-landscape ·
agent-harness-survey · agent-memory-survey · reso-standards.
