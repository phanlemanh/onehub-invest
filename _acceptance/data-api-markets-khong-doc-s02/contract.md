---
schema_version: 1
feature: data-api — bốn đường /v1/markets (danh sách, chi tiết, submarkets, insights) thôi đọc và thôi trả số S02; rào test đỏ khi route nào của data-api tham chiếu bảng S02
slug: data-api-markets-khong-doc-s02
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [api]
status: draft
design_doc:
approved_by:
approved_at:
---

# Acceptance Contract: data-api-markets-khong-doc-s02

> NHÁP S1 (M5, 27/11). Chưa trình Cổng Phạm vi: chờ GS soát bảng phủ ca và ba câu Hỏi; Hỏi-1, Hỏi-2 là quyết định sản
> phẩm của Mạnh (gs 24/11 11:31Z, kênh #4: «gỡ số S02 khỏi markets … thay bằng chỉ số tự tính hay gỡ đường — cần Cổng
> Phạm vi riêng của Mạnh»).

## Context

`data-api/` là API công khai (đi kho public `onehub-data-api`). Cả bốn đường của `data-api/src/routes/markets.ts` đọc bảng
của S02 qua `area_sources` nguồn `S02`: danh sách trả `marketScore` và **xếp theo điểm S02**; chi tiết trả khối
`marketScore` năm điểm con; submarkets nối bảng chỉ số tiểu vùng của S02; insights trả trọn chuỗi tháng của S02. AGENTS.md
luật 5: số S02 chỉ để hiệu chuẩn, chỉ hiện ở `/ops/quality` — không lên API công khai. Bản app của cùng lỗi
(`/api/v1/markets`) đã sửa ở HT23 (`_acceptance/api-markets-khong-tra-so-s02`, gộp): bỏ `marketScore`, xếp theo số tin.
HT19 và PB3 đã gộp; `data-api` chưa triển khai (project chưa có `DATA_API_KEYS`) nên đổi hình bây giờ không gãy người gọi.

Vùng: `data-api/src/routes/markets.ts`, `data-api/src/app.ts` (chỉ mô tả bốn đường trong `/openapi.json`),
`data-api/README.md` (bảng đường), `data-api/test/markets-khong-s02.test.ts` (mới), đúng các khoá
`executors.*.dapi_mk*` thêm vào `_acceptance/config.yaml`, `PRODUCT-MAP.md`, `LO-TRINH.html`, hồ sơ này.

## Bảng phủ ca (đếm 27/11 trên DB `oneinvest` của M5 — bản đầy đủ máy thu chép sang 26/11 05:45Z; chỉ đọc)

| Đường | Ô | Số đếm | Hôm nay trả gì | Ai đọc phía sau |
|---|---|---|---|---|
| `GET /v1/markets` | thị trường VN | 34 | 34 dòng | khách API ngoài (chưa có — chưa triển khai) |
| | có điểm S02 nối qua `area_sources` | 29 | `marketScore` = số S02, xếp lên đầu | như trên |
| | có tin S01 (`listing_count` > 0) | 2 | `listingCount` | như trên |
| `GET /v1/markets/:id` | thị trường có điểm S02 | 29 | khối `marketScore` năm điểm con S02 | như trên |
| | thị trường không điểm S02 | 5 | `marketScore` null | như trên |
| `GET /v1/markets/:id/submarkets` | tiểu vùng VN | 3321 | danh sách | như trên |
| | tiểu vùng nối S02 | 0 | `marketScore`, `metrics` luôn null — nhưng câu vẫn đọc bảng chỉ số tiểu vùng S02 (40 dòng) | như trên |
| | tiểu vùng có tin S01 | 83 | — (đường không trả gì từ S01) | như trên |
| `GET /v1/markets/:id/insights` | thị trường có chuỗi tháng S02 | 29 | `latestMetrics` + `timeseries` của S02 | như trên |
| | thị trường có chỉ số tự tính `market_metrics` (S01) | 2 (26 dòng tháng) | — | như trên |
| | tiểu vùng có `market_metrics` (S01) | 83 (1051 dòng) | — | như trên |

Ô bỏ: `market_asset_stats` (206 khu, giá bán/thuê S06/S03) — đã có đường `/v1/asset-stats`, ngoài phạm vi, vì không phải số
thay cho S02.

## Criteria

- AC-1: Given DB thử có lược đồ thật (`db/db-thu.sh --chay`), ba thị trường VN, một thị trường có điểm S02 nối qua
  `area_sources` và ít tin nhất, cấy dòng canh vào mọi bảng S02 (`airdna_*`) với số và chuỗi canh riêng, When gọi
  `GET /v1/markets?country=vn&limit=5`, Then 200; mọi dòng có đúng bốn khoá `id`, `name`, `countryCode`, `listingCount`;
  không dòng nào có `marketScore`; thứ tự `listingCount` giảm dần, bằng nhau thì theo tên; thân không chứa số hay chuỗi canh
  nào. Chiều đỏ: route cũ trên cùng DB trả `marketScore` và đặt thị trường có điểm S02 lên đầu.
- AC-2: Given cùng DB thử, When gọi `GET /v1/markets/:id` với thị trường có điểm S02, thị trường không điểm, mã cũ (dài) và
  mã không có, Then hai thị trường trả đúng `id`, `name`, `countryCode` (+ phần thay theo Hỏi-1), không khoá `marketScore`,
  không số/chuỗi canh; mã cũ giải như hôm nay; mã không có → 404 `{error: {code: "NOT_FOUND", …}}`.
- AC-3: Given cùng DB thử, tiểu vùng có tin S01 và một tiểu vùng cấy nối S02 kèm dòng canh trong bảng chỉ số tiểu vùng S02,
  When gọi `GET /v1/markets/:id/submarkets`, Then mỗi dòng không có số/chuỗi canh S02, khoá theo Hỏi-2; thứ tự theo tên.
- AC-4: Given cùng DB thử, thị trường có chuỗi tháng S02 canh, When gọi `GET /v1/markets/:id/insights`, Then thân không chứa
  số/chuỗi canh S02; nội dung theo Hỏi-2 (chỉ số tự tính từ `market_metrics` nguồn S01, hay đường bị gỡ → 404/410 có
  thông điệp ghim).
- AC-5: Given bộ ghi SQL của test (cùng cách HT19: bọc `pool.query`), When gọi đủ bốn đường ở AC-1–AC-4, Then không câu SQL
  nào tham chiếu bảng `airdna_*` hay `area_sources` với nguồn `S02`. Rào tĩnh: test quét mọi tệp `data-api/src/**` (bỏ chú
  thích) và đỏ khi có tên bảng S02 hay chuỗi `'S02'` trong SQL; đối chứng trong test: cấy lại câu JOIN cũ (văn bản ghim, không
  đọc git) thì đúng đường `markets` đỏ với thông điệp ghim «HT20 route đọc bảng S02: <tệp>».
- AC-6: Given test của AC-1–AC-5, When thay `markets.ts` bằng bản ở merge-base với `main` trong bản chép tạm của `data-api/`,
  Then ca AC-1, AC-2, AC-4, AC-5 đỏ với thông điệp ghim riêng; bản không thay xanh.
- AC-7: Given nhánh sau hàng, When soát, Then mọi tệp đổi nằm trong vùng ở Context; `/openapi.json` và `data-api/README.md`
  tả bốn đường đúng hình mới, không còn chữ «Market Score»; lưới tên nguồn của PB5 (`scripts/data-api-ten-nguon.mjs`, khi
  PB5 đã gộp) sạch; `npm run typecheck` trong `data-api/` thoát 0; `data-api/test/dong-ba-route.test.ts` và
  `auth-dong.test.ts` vẫn xanh.

## Coverage

- Trục A — đường: danh sách · chi tiết · submarkets · insights [thước CE: bốn handler của `markets.ts`]
- Trục B — dòng khu vực: có điểm S02 · không điểm · có tin S01 · không tin · mã cũ · mã không có [thước CE: bảng phủ ca]
- Trục C — đường lộ S02: khoá phản hồi · thứ tự · câu SQL lúc chạy · tên bảng trong mã [AC-1, AC-5]
- Trục D — vật ngoài route: openapi · README · test cũ của data-api · typecheck [AC-7]

## Out of scope

- `data-api/seed.sql` và lược đồ mẫu `data-api/db/**` (câu chèn điểm S02 của seed): hàng PB2 AC-9 bỏ, PB5 dọn tên nguồn.
- Đổi tên trường theo RESO (PB2 không đụng `markets.ts`; HT20 giữ tên camelCase hiện có cho khoá còn lại).
- `/api/v1/markets` của app (HT23 đã gộp), `/ops/quality` và mọi màn Ops dùng điểm S02.
- Triển khai data-api, `sync-public`, DDL, ghi cloud.

## Notes — câu hỏi trước Cổng Phạm vi

- Hỏi-1 (Mạnh): chi tiết thị trường thay khối `marketScore` bằng gì — (a) bỏ hẳn, chỉ `id`, `name`, `countryCode`,
  `listingCount` như danh sách (khuyến nghị: không có chỉ số tự tính nào ở cấp thị trường đủ phủ — `market_metrics` chỉ 2/34
  thị trường); (b) thêm khối chỉ số tự tính từ `market_metrics` (S01) khi có.
- Hỏi-2 (Mạnh): submarkets và insights — (a) insights đọc `market_metrics` nguồn S01 (ADR, lấp đầy, doanh thu, RevPAR theo
  tháng; phủ 2 thị trường, 83 tiểu vùng), submarkets bỏ `marketScore`/`metrics` S02 và thêm `listingCount` (khuyến nghị:
  đường giữ nghĩa, số là của OneHub); (b) gỡ hẳn insights (404/410) và submarkets chỉ còn danh sách tên.
  Lưu ý cho Hỏi-2(a): `market_metrics` có tháng tới 2027-10 (lịch đặt phòng tương lai của S01) — hợp đồng sẽ phải nói rõ tháng
  nào là «đã qua».
- Hỏi-3 (GS): thứ tự gộp — HT20 trước PB2 (PB2 AC-9 gọi bốn đường markets trên lược đồ mẫu; PB2 tự gộp `main` sau HT20).
