---
schema_version: 1
feature: data-api đóng ba đường trả dữ liệu trái luật (HT19) — deals thôi trả nội dung bài S03, coverage và listings/:id thôi đọc bảng S02
slug: data-api-dong-ba-route-lo
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [api, docs]
status: implemented
design_doc: _acceptance/data-api-dong-ba-route-lo/design.md
approved_by: Mạnh
approved_at: 2026-11-24
---

# Acceptance Contract: data-api-dong-ba-route-lo

## Context

`data-api/` là API công khai (mã đẩy nguyên văn sang kho public). Trước khi API được triển khai, ba đường đang trả dữ liệu
trái luật AGENTS.md: `/v1/deals` trả tên nhóm, tên người gửi, chữ bài, đường ảnh của bài S03 đọc từ `stg_zalo_posts` thô
(luật 6: các thứ này chỉ hiện ở Ops); `/v1/coverage` và `/v1/listings/:id` đọc bảng S02 (luật 5: S02 chỉ để hiệu chuẩn).
Hàng này gỡ phần trái luật, giữ phần hợp luật, và đặt ca test đỏ khi phần cấm quay lại.

Source input: lời giao `gs-2411-1` (kênh điều phối riêng tư, issue #4), hàng HT19. Thiết kế: `design.md` cùng thư mục.

## Criteria

- AC-1: Given DB thử có lược đồ thật của kho, một tin bán S03 có dòng xếp hạng trong `offer_price_rank` và bài gốc trong
  `stg_zalo_posts` mang tên nhóm, tên người gửi, chữ bài, đường ảnh là các chuỗi canh, When gọi `GET /v1/deals`, Then trả
  200, tin đó có trong `data` với giá, `discountPct` và khối `rank` như trước, phần tử không có khoá `contact`, `postText`,
  `senderName`, `groupName`, `mediaPath` (quét đệ quy cả thân), và không chuỗi canh nào xuất hiện trong thân trả về.
- AC-2: Given cùng DB thử, When gọi `GET /v1/deals` ở nhánh có bảng hạng và ở nhánh thước CG8 (bảng hạng rỗng, đủ 5 căn
  bán cùng phường × loại hình để `v_ruler_p2` có dòng), Then mọi câu SQL route phát ra ở cả hai nhánh không nhắc
  `stg_zalo_posts`, và nhánh CG8 trả 200 với tin canh có trong `data` mang `priceVnd`, `medianPerm2`, `discountPct` đúng tên
  và kiểu như trên `main` (không khối `rank`, `meta` không `kind` — như trên `main`).
- AC-3: Given DB thử có dòng S02 canh trong `area_sources`, `airdna_market_metrics`, `airdna_listings` cho một thị trường VN
  và tin tự thu thuộc thị trường đó, When gọi `GET /v1/coverage`, Then trả 200, mỗi thị trường VN (kể cả thị trường không
  có dữ liệu S02) có `areaId`, `name`, `ourListings` đếm đúng số tin tự thu; không khoá `calibrationActive`,
  `calibrationPeriod`, `calibrationUniverse`, `historyMonths`, `coverageRatio`; không giá trị canh nào trong thân; và mọi câu
  SQL route phát ra không nhắc `airdna_` hay `area_sources`.
- AC-4: Given một tin tự thu không có ảnh mà id trùng một dòng `airdna_listings` mang ảnh và đường dẫn canh, và một tin tự
  thu có ảnh, When gọi `GET /v1/listings/:id` cho từng tin và cho một id không có, Then tin không ảnh trả
  `photos: {urls: null, source: null}`, tin có ảnh trả `photos.source = "self"` với ảnh tự thu, không phần tử nào có khoá
  `listingUrl` hay chuỗi canh, id không có trả 404 như cũ, và mọi câu SQL route phát ra không nhắc `airdna_`.
- AC-5: Given `GET /v1/listings` (danh sách) không thuộc ba đường phải gỡ, When gọi nó trên cùng DB thử, Then trả 200 với
  cùng các khoá như trên `main` (`id`, `name`, `roomType`, `bedrooms`, `priceListed`, `lat`, `lng`, `photoUrls`,
  `reviewCount`, `area`, `market`, `stats`) — hàng này không làm hỏng đường không được giao.
- AC-6: Given tệp test của AC-1–AC-5, When thay lần lượt từng route `deals.ts`, `coverage.ts`, `listings.ts` bằng bản trên
  `main` (merge-base) trong một bản chép tạm của `data-api/` rồi chạy cùng tệp test, Then mỗi bản cũ đỏ ở đường của mình ở
  CẢ HAI lớp, mỗi lớp một thông điệp ghim riêng (lớp JSON: khoá cấm hay chuỗi canh; lớp SQL: bảng cấm), hai lớp assert độc
  lập không lớp nào chặn lớp kia; ca của các đường còn lại xanh ở cả ba ô; bản chép không thay thì xanh.
- AC-7: Given `data-api/README.md` và `data-api/CLAUDE.md` sau hàng, When người đọc tra bề mặt của ba đường, Then hai tệp mô
  tả đúng các trường còn lại của `/v1/deals`, `/v1/coverage`, `/v1/listings/:id` (không còn nhắc trường đã gỡ như có), và
  `CLAUDE.md` có luật: data-api không đọc bảng `stg_*` thô, không đọc bảng S02, không trả chữ bài, ảnh, tên nhóm, tên người
  gửi của S03 (judgment); và toàn văn hai tệp không có tên nguồn thật nào ngoài dạng định danh (máy soát, AC-8).
- AC-8: Given diff của nhánh so với merge-base với `main`, When soát phạm vi, Then mọi tệp đổi nằm trong ranh giới lời giao
  (ba route, `data-api/test/**`, `data-api/README.md`, `data-api/CLAUDE.md`, `_acceptance/data-api-dong-ba-route-lo/**`,
  cộng đúng các khoá lệnh `executors.*.dapi_drl*` của hàng trong `_acceptance/config.yaml`, không khoá nào khác của tệp đó,
  và hai tệp máy sinh `PRODUCT-MAP.md`, `LO-TRINH.html` do lệnh duyệt, ký của kit vẽ lại), không đổi
  `data-api/db/**`, `data-api/seed.sql`, `app/`, `pipeline/`, `db/`, và không tên nguồn thật nào (rút từ các câu `INSERT INTO source_registry` của `db/migrations` bằng
  `scripts/lib/tier-a-source-names.mjs`, không in ra) xuất hiện trong phần thêm của diff dưới `data-api/` — trừ dạng định
  danh có `_` liền kề (tên bảng), cùng ngoại lệ với `scripts/check-invest-tier-a.mjs`.
- AC-9: Given nhánh sau hàng, When chạy `npm run typecheck` trong `data-api/`, Then thoát 0.

## Coverage

Quét hình thái làm tay trong bước thiết kế (không nạp skill — không gian nhỏ, liệt kê đủ được; entry approach trong sổ).

- Trục A — đường × nhánh: deals-có-bảng-hạng · deals-thước-CG8 · coverage · listings/:id-không-ảnh · listings/:id-có-ảnh ·
  listings/:id-không-có · listings-danh-sách (không giao, chỉ chống hỏng) [thước CE: ba đường trong lời giao `gs-2411-1` +
  nhánh `coBangHang()` trong `deals.ts`]
- Trục B — loại cấm: nội dung S03 (tên nhóm · tên người gửi · chữ bài · ảnh) · bảng S02 (`area_sources` S02 ·
  `airdna_market_metrics` · `airdna_listings`) · trường suy từ S02 (5 trường coverage · ảnh dự phòng · `listingUrl`)
  [thước CE: luật 5, 6 AGENTS.md]
- Trục C — lớp đo: JSON trả về (khoá + chuỗi canh) · SQL phát ra · chiều đỏ trên bản cũ [CE chưa kiểm chứng]
- Trục D — vật ngoài mã: README · CLAUDE.md · phạm vi diff · tên nguồn thật · typecheck
- Ô A×B bỏ: `/v1/markets` đọc S02 — ngoài lời giao (đã hỏi gs `m5-2411-1`; entry descope).

## Out of scope

- `/v1/markets`, `/v1/markets/:id`, `/:id/submarkets`, `/:id/insights` (`markets.ts`) vẫn đọc bảng S02 — hàng riêng HT20
  `data-api-markets-khong-doc-s02` (gs trả lời `m5-2411-1`: gỡ số S02 khỏi markets là quyết định sản phẩm, Cổng Phạm vi riêng).
- Sửa lược đồ mẫu `data-api/db/*.sql` và `seed.sql` — hàng riêng PB1 `luoc-do-mau-data-api-v-ruler-p2` (gs trả lời
  `m5-2411-2`). Hiện trạng hỏng sẵn trên `main` be765e6a5, đo 24/11 trên DB rỗng: `012_source_registry_roles_dq.sql` lỗi
  «relation "area_sources" does not exist» (UPDATE khi chưa tệp nào tạo bảng), `seed.sql` đổ cùng lỗi, lược đồ mẫu thiếu
  `offer_price_rank`, `v_ruler_p2`, `properties` nên `/v1/deals` không chạy được trên nó. Hàng này giữ «không làm hỏng thêm»:
  diff không chạm hai thứ đó (AC-8).
- Đưa tên, SĐT người bán S03 lên data-api qua đường đã làm sạch (`sale_offers` trên cloud) — luật 6 cho phép ở cổng Invest
  nhưng là việc khác; hàng này chỉ gỡ đường đọc bài thô.
- Đổi `/openapi.json` hay `docs/api/openapi.yaml` (cái thứ nhất chỉ có tóm tắt từng đường, cái thứ hai là API của app).
- Triển khai data-api, đồng bộ sang kho public (`sync-public` chỉ người gọi).
- Đổi tên trường của API sang tên RESO DD 2.1 (ví dụ `priceVnd` → `listPrice`, `propertyType` → `propertySubType`) và gộp
  `/v1/listings` với `/v1/deals` thành một tài nguyên listing có `kind` — đề xuất hàng riêng đã gửi gs (`m5-2411-4`, Mạnh
  đồng ý 24/11: hàng này giữ hẹp, chỉ gỡ trường, không thêm và không đổi tên trường nào).

## Notes

- Hỏi-1 (Cổng Phạm vi, Mạnh quyết): gỡ trường (khuyến nghị, đường giữ, khoá cấm bỏ hẳn) hay gỡ đường (`coverage` trả 410).
  AC-3 viết theo khuyến nghị; chọn gỡ đường thì AC-3 đổi thành «trả 410, không câu SQL nào» trước khi duyệt.
- gs đã trả lời theo khuyến nghị (24/11): được thêm đúng các khoá `executors.*.dapi_drl*` vào `_acceptance/config.yaml`, chỉ
  thêm, gộp `origin/main` xung đột thì giữ cả hai phía (`m5-2411-1`); đo trên lược đồ thật dựng từ migration bằng
  `db-thu --chay` có cấy dòng canh, tiêu chí lược đồ mẫu đổi thành «không làm hỏng thêm» (`m5-2411-2`).
- Hỏi-2 (Cổng Phạm vi, Mạnh quyết): deals bỏ cả tên người gửi ở hàng này (khuyến nghị) hay giữ tên người bán đọc từ
  `sale_offers` đã làm sạch ngay trong hàng này.
- Ca đỏ đã biết trên M5, không do nhánh: QV-AC-5 ở `app/tests/quyen-bon-vai.test.tsx` (lệch môi trường docker).
