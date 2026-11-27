---
schema_version: 1
feature: data-api — bốn đường /v1/markets (danh sách, chi tiết, submarkets, insights) thôi đọc và thôi trả số S02; rào test đỏ khi route nào của data-api tham chiếu bảng S02
slug: data-api-markets-khong-doc-s02
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [api]
status: approved
design_doc:
approved_by: Mạnh
approved_at: 2026-11-27
---

# Acceptance Contract: data-api-markets-khong-doc-s02

> Trình Cổng Phạm vi 27/11 (GS soát bảng phủ ca, chốt Hỏi-3: HT20 gộp trước PB2). Hỏi-1, Hỏi-2 là quyết định sản phẩm
> của Mạnh (gs 24/11 11:31Z: «gỡ số S02 khỏi markets … thay bằng chỉ số tự tính hay gỡ đường — cần Cổng Phạm vi riêng của
> Mạnh»). AC-2–AC-7 viết theo khuyến nghị; Mạnh chọn khác thì các AC, eval ghi ở từng câu đổi trước khi ký.

## Context

`data-api/` là API công khai (đi kho public `onehub-data-api`). Cả bốn đường của `data-api/src/routes/markets.ts` đọc bảng
của S02 qua `area_sources` nguồn `S02`: danh sách trả `marketScore` và **xếp theo điểm S02**; chi tiết trả khối
`marketScore` năm điểm con; submarkets nối bảng chỉ số tiểu vùng của S02; insights trả trọn chuỗi tháng của S02. AGENTS.md
luật 5: số S02 chỉ để hiệu chuẩn, chỉ hiện ở `/ops/quality` — không lên API công khai. Bản app của cùng lỗi
(`/api/v1/markets`) đã sửa ở HT23 (`_acceptance/api-markets-khong-tra-so-s02`, gộp): bỏ `marketScore`, xếp theo số tin.
HT19 và PB3 đã gộp. **Hiện API chưa mở cho bên ngoài**: project chưa có `DATA_API_KEYS`, chưa triển khai — số S02 đang nằm
trong mã sẽ đi ra API ngay khi mở; đổi hình bây giờ không gãy người gọi nào.

Vùng: `data-api/src/routes/markets.ts`, `data-api/src/app.ts` (chỉ mô tả bốn đường trong `/openapi.json`),
`data-api/README.md` (bảng đường), `data-api/CLAUDE.md` (mục lệnh test + luật «không đọc bảng S02» trỏ rào mới),
`data-api/test/markets-khong-s02.test.ts` (mới), đúng các khoá
`executors.*.dapi_mk*` thêm vào `_acceptance/config.yaml`, `PRODUCT-MAP.md`, `LO-TRINH.html`, hồ sơ này.
`docs/ROADMAP.md` §2/§4 ngoài vùng: M5 không giữ ROADMAP — GS ghi as-built sau gộp.

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

Về chỉ số tự tính `market_metrics` (đo 27/11, `pipeline/sql/300_metrics.sql`): hai thị trường có số là `vn-hanoi`, `vn-hcmc`;
cửa sổ là **lịch 12 tháng TỚI** của S01 tính từ lúc thu (bảng `nights` từ 2026-10-01 tới 2027-10-31, 346 750 đêm, chỉ 43 176
đêm trước 27/11). «Đã đặt» = đêm không trống trên lịch, gồm cả đêm chủ nhà chặn — tức tháng 2026-12 … 2027-10 là lịch dự kiến,
không phải doanh thu hay công suất đã xảy ra; 75/1077 dòng thuộc tháng đã qua.

Ô bỏ: `market_asset_stats` (206 khu, giá bán/thuê S06/S03) — đã có đường `/v1/asset-stats`, ngoài phạm vi, vì không phải số
thay cho S02.

## Criteria

Chung cho AC-1–AC-6: DB thử có lược đồ thật (`db/db-thu.sh --chay`, bản chép dữ liệu thật: 34 thị trường VN, 29 có điểm
S02). Dòng cấy của test nằm ở **quốc gia riêng `zz`** để không lẫn với thị trường thật (bẫy đã ghi ở
`dong-ba-route.test.ts`); điểm và chỉ số canh S02 lớn hơn mọi số thật của bảng tương ứng; mỗi ca **khẳng định dòng cấy có
mặt** trong thân trước khi soát chuỗi canh. Bộ ghi SQL bọc `pool.query`, ghi cả văn bản câu lẫn mảng tham số.

- AC-1: Given ba thị trường `zz` — `zz-a` 3 tin, `zz-b` 1 tin có điểm S02 canh nối qua `area_sources`, `zz-c` 1 tin — và
  dòng canh ở mọi bảng S02, When gọi `GET /v1/markets?country=zz&limit=5`, Then 200; đúng ba dòng, mỗi dòng đúng bốn khoá
  `id`, `name`, `countryCode`, `listingCount`; không `marketScore`; thứ tự `zz-a`, `zz-b`, `zz-c` (`listingCount` giảm dần,
  bằng nhau theo tên); `meta` đúng hai khoá `total` = 3, `limit` = 5; thân không chứa số/chuỗi canh. Chiều đỏ: route cũ trên
  cùng DB trả `marketScore` và đặt `zz-b` lên đầu.
- AC-2: Given cùng DB thử, When gọi `GET /v1/markets/:id` với `zz-b` (có điểm S02), `zz-a` (không điểm), mã dài cũ của một
  thị trường và mã không có, Then hai thị trường trả đúng bốn khoá như dòng danh sách (Hỏi-1 a) và `listingCount` bằng số tin
  cấy, bằng dòng tương ứng ở `/v1/markets`; không `marketScore`, không số/chuỗi canh; mã cũ cho cùng thân với mã ngắn; mã
  không có → 404 `{error: {code: "NOT_FOUND", …}}`.
- AC-3: Given tiểu vùng `zz-a-1` 2 tin, `zz-a-2` 1 tin nối S02 kèm dòng canh trong bảng chỉ số tiểu vùng S02, When gọi
  `GET /v1/markets/zz-a/submarkets`, bằng mã dài cũ, và bằng mã không có, Then mỗi dòng đúng ba khoá `id`, `name`,
  `listingCount` (Hỏi-2 b), `listingCount` khớp số tin cấy, thứ tự theo tên, không `marketScore`, `metrics`, không số/chuỗi
  canh; mã cũ cho cùng thân với mã ngắn; mã không có → 200 `{data: [], meta: {total: 0}}` (như hôm nay).
- AC-4: Given thị trường có chuỗi tháng S02 canh, When gọi `GET /v1/markets/:id/insights` với mã có, mã cũ và mã không có,
  Then cả ba trả 410 thân `{error: {code: "GONE", message}}` với thông điệp ghim «insights đã gỡ: số theo tháng của thị
  trường chưa có nguồn tự thu đủ phủ» (Hỏi-3 b), không phát câu SQL nào, thân không chứa số/chuỗi canh; `/openapi.json` không
  còn đường này.
- AC-5: Given bộ ghi SQL, When gọi danh sách, chi tiết, submarkets ở AC-1–AC-3, Then mỗi đường phát ≥ 1 câu, và không câu nào
  nhắc `area_sources`, `airdna_*` hay `ref_calib_*` (tên bảng S02 phía cloud), không tham số nào bằng `'S02'`; insights phát 0
  câu. Rào tĩnh: test quét mọi chuỗi trong mã của `data-api/{src,api}/**` sau khi bỏ chú thích, đỏ khi có `airdna_`,
  `ref_calib_`, `area_sources` hay chuỗi `S02` đứng riêng; đơn vị vi phạm là **một tệp** (thông điệp ghim «HT20 route đọc
  bảng S02: <tệp>»). Đột biến trong cùng ca, mỗi cái đúng một tệp đỏ: cấy lại câu JOIN cũ (văn bản ghim, không đọc git) vào
  `markets.ts`; câu `WHERE source = $1` truyền `['S02']`; câu `FROM ref_calib_scores`.
- AC-6: Given test của AC-1–AC-5, When thay `markets.ts` bằng bản ở merge-base với `main` trong bản chép tạm của `data-api/`,
  Then ca AC-1, AC-2, AC-3, AC-4, AC-5 mỗi ca đỏ với thông điệp ghim riêng («HT20-AC-n …»); bản không thay xanh.
- AC-7: Given nhánh sau hàng, When soát, Then mọi tệp đổi nằm trong vùng ở Context; ở `data-api/README.md` và `/openapi.json`,
  các dòng của đường markets không còn chữ nào trong danh sách cấm «score», «Market Score», «ADR», «occupancy», «revenue»,
  «metrics», và insights không còn là đường sống; `npm run typecheck` trong `data-api/` thoát 0; `dong-ba-route.test.ts`,
  `auth-dong.test.ts` xanh; lưới tên nguồn PB5 (`scripts/data-api-ten-nguon.mjs`) sạch — tệp lưới vắng (PB5 chưa gộp) thì
  lệnh in đúng dòng «HT20 lưới tên nguồn: bỏ qua — PB5 chưa gộp» và chạy thay phép soát của
  `scripts/lib/tier-a-source-names.mjs` trên các tệp đổi (không in tên).

## Coverage

- Trục A — đường: danh sách · chi tiết · submarkets · insights [thước CE: bốn handler của `markets.ts`]
- Trục B — dòng khu vực: có điểm S02 · không điểm · nhiều/ít tin · mã cũ · mã không có — ở danh sách, chi tiết, submarkets,
  insights [thước CE: bảng phủ ca; AC-1–AC-4]
- Trục C — đường lộ S02: khoá phản hồi · thứ tự · câu SQL lúc chạy · tên bảng trong mã [AC-1, AC-5]
- Trục D — vật ngoài route: openapi · README · test cũ của data-api · typecheck [AC-7]

## Out of scope

- `data-api/seed.sql` và lược đồ mẫu `data-api/db/**` (câu chèn điểm S02 của seed): hàng PB2 AC-9 bỏ, PB5 dọn tên nguồn.
- Đổi tên trường theo RESO (PB2 không đụng `markets.ts`; HT20 giữ tên camelCase hiện có cho khoá còn lại).
- `/api/v1/markets` của app (HT23 đã gộp), `/ops/quality` và mọi màn Ops dùng điểm S02.
- Triển khai data-api, `sync-public`, DDL, ghi cloud.

## Notes

- Hỏi-1 (Cổng Phạm vi, Mạnh quyết): chi tiết thị trường thay khối điểm S02 bằng gì — **(a) bỏ hẳn, chi tiết trả bốn khoá như
  một dòng danh sách** (khuyến nghị: số tự tính chỉ có ở 2/34 thị trường và là lịch dự kiến; tiền lệ HT23 bỏ hẳn ở route app);
  (b) thêm khối chỉ số tự tính từ `market_metrics` khi có (32/34 thị trường trả khối rỗng). Chọn (b) → đổi AC-2, E2.
- Hỏi-2 (Cổng Phạm vi, Mạnh quyết): danh sách tiểu vùng — **(b) chỉ tên + số tin** (khuyến nghị: hôm nay 0/3321 tiểu vùng có
  số S02 nối được, số tự tính có ở 83/3321); (a) thêm chỉ số tự tính `market_metrics` khi có. Chọn (a) → đổi AC-3, E3.
- Hỏi-3 (Cổng Phạm vi, Mạnh quyết): đường «chỉ số theo tháng» (insights) — **(b) gỡ, trả 410** (khuyến nghị: số tự tính là
  lịch 12 tháng TỚI, «đã đặt» gồm đêm chủ nhà chặn, chỉ Hà Nội và TP.HCM — đưa ra API công khai thành «công suất, doanh thu»
  là nói quá; AGENTS.md luật 11 đo trước khi dựng; thêm lại sau không phá ai); (a) giữ đường, đọc `market_metrics` (S01), ghi
  rõ «lịch dự kiến». Chọn (a) → đổi AC-4 (thân mới thay 410), AC-5 (insights phát câu đọc `market_metrics`), AC-6 (ca AC-4
  đỏ trên bản cũ vì lộ chuỗi canh), AC-7 (openapi giữ đường), E4–E7.
- Đã chốt (GS 27/11, câu thứ tự gộp cũ): HT20 gộp trước PB2; PB2 gộp cuối, tự gộp `main` sau HT20.
- Giới hạn đã biết (ghi trước): nửa «bằng nhau thì theo tên» của thứ tự danh sách không có chiều đỏ trên bản cũ (bản cũ cũng
  xếp theo tên ở khoá thứ hai) — cùng giới hạn HT23 đã nhận; đo ở hàng HT28 `api-markets-doi-chung-tren-db` nếu GS mở rộng
  sang data-api.
