# Thiết kế — data-api đóng ba đường trả dữ liệu trái luật (HT19)

Lời giao: `gs-2411-1` trên kênh điều phối (gs → m5, 24/11). Hàng chạy trên máy M5, nhánh `fix/data-api-dong-ba-route-lo`.

## Vấn đề

`data-api/` là API công khai (mã đẩy nguyên văn sang kho public `onehub-data-api`). Ba đường của nó đang trái luật bất biến
của AGENTS.md, trước khi API được triển khai:

| Đường | Đọc gì | Trả gì | Luật bị phạm |
|---|---|---|---|
| `GET /v1/deals` | `LEFT JOIN LATERAL stg_zalo_posts` (bài gốc S03 thô) | `contact.senderName`, `contact.groupName`, `contact.mediaPath`, `postText` (200 ký tự chữ bài) | luật 6: chữ bài, ảnh, tên nhóm S03 chỉ hiện ở `/ops/**`; `stg_*` thô không rời máy nguyên bảng |
| `GET /v1/coverage` | `airdna_market_metrics`, `airdna_listings`, `area_sources` nguồn `S02` | `calibrationActive/Period/Universe`, `historyMonths`, `coverageRatio` | luật 5: số S02 chỉ để hiệu chuẩn, chỉ ở `/ops/quality` |
| `GET /v1/listings/:id` | `LEFT JOIN airdna_listings` | ảnh dự phòng `photos.source = "calibration"`, `listingUrl` | luật 5 (và `listingUrl` của S02 mang tên miền nguồn thật — tầng A) |

## Cách làm (khuyến nghị — Hỏi-1 ở Cổng Phạm vi)

**Gỡ trường, giữ đường** cho cả ba:

- **deals**: bỏ hẳn khối `LEFT JOIN LATERAL stg_zalo_posts`; bỏ hai khoá `contact` và `postText` khỏi mỗi phần tử. Mọi
  trường giá, hạng (`rank`), `meta` giữ nguyên tên và kiểu, ở cả nhánh có bảng hạng (`offer_price_rank`) lẫn nhánh thước
  CG8 (`v_ruler_p2`).
- **coverage**: bỏ mọi câu đọc bảng S02. Mỗi thị trường VN (`areas.region_type = 'market'`, `country_code = 'vn'`) trả
  `areaId`, `name`, `ourListings` (số tin tự thu thuộc thị trường đó). Bỏ khoá `calibrationActive`, `calibrationPeriod`,
  `calibrationUniverse`, `historyMonths`, `coverageRatio`. Trước đây đường chỉ liệt thị trường có dữ liệu S02 (JOIN
  LATERAL trong); nay liệt mọi thị trường VN.
- **listings/:id**: bỏ `LEFT JOIN airdna_listings`. `photos.urls` chỉ từ ảnh tự thu (`listings.photo_urls`), `photos.source`
  là `"self"` hoặc `null`; bỏ khoá `listingUrl`. Tin không có → 404 như cũ. `/v1/listings` (danh sách) không đổi.

Bỏ khoá chứ không giữ khoá trả `null`: API chưa triển khai nên chưa có người dùng v1 cần giữ hình; khoá luôn `null` làm
người đọc tưởng sẽ có dữ liệu. Lối khác cho coverage: **gỡ đường** — `coverage.ts` trả `410 Gone` kèm lời giải thích (không
cần sửa `app.ts`, nằm trong ranh giới). Giá: mất con số «số tin tự thu theo thị trường» vốn vẫn hợp luật.

`/openapi.json` (trong `app.ts`) chỉ có dòng tóm tắt từng đường, không mô tả trường → không phải sửa; `docs/api/openapi.yaml`
mô tả API của app (`/api/v1/**`), không phải data-api → không phải sửa.

## Đo thế nào

Một tệp test `data-api/test/dong-ba-route.test.ts` (`node:test` + `tsx`, gọi `app.request(...)` trực tiếp, không mở cổng):

- Chạy trên **lược đồ thật** của kho (DB thử chép bản mẫu bằng `db/db-thu.sh --chay`), không trên lược đồ mẫu
  `data-api/db/*.sql` + `seed.sql`: lược đồ mẫu hỏng sẵn trên main (012 cập nhật `area_sources` khi chưa có bảng nào tạo
  nó; thiếu `offer_price_rank`, `v_ruler_p2`, `properties`) — đã báo gs (`m5-2411-2`), sửa là hàng riêng.
- Test **cấy dòng canh** vào đúng các bảng bị cấm: một bài `stg_zalo_posts` gắn với tin bán xếp hạng, mang tên nhóm, tên
  người gửi, chữ bài, đường ảnh là chuỗi canh duy nhất; dòng S02 trong `area_sources`, `airdna_market_metrics`,
  `airdna_listings` (cùng id với một tin tự thu không ảnh) mang ảnh và đường dẫn canh. Bản mã cũ sẽ trả các chuỗi canh đó.
- Hai lớp đo mỗi đường: (1) **JSON trả về** — không khoá cấm (quét đệ quy), không chuỗi canh nào trong thân; (2) **câu SQL
  route phát ra** (bọc `pool.query` để ghi lại) — không nhắc `stg_zalo_posts`, `airdna_`, `area_sources`.
- Đối chứng dương: trường được giữ vẫn đúng (giá, hạng, `ourListings` đếm đúng, `photos.source = "self"` khi có ảnh tự thu,
  404 khi không có tin).
- **Chiều đỏ**: probe `probes/pha.mjs` chép `data-api/` sang thư mục tạm, thay lần lượt từng route bằng bản trên `main`
  (merge-base) rồi chạy cùng tệp test → mỗi bản cũ phải đỏ đúng ca của đường mình với thông điệp ghim; bản chép không thay
  → xanh.
- Test từ chối chạy khi `DATABASE_URL` không phải DB thử (tên không chứa `_suite_`), vì nó ghi dòng canh.

## Ngoài lời giao (ghi, không làm)

- `data-api/src/routes/markets.ts` cũng đọc bảng S02 (`airdna_scores`, `airdna_market_metrics`, `airdna_submarket_metrics`
  qua `area_sources` S02) ở `/v1/markets`, `/:id`, `/:id/submarkets`, `/:id/insights` — đã hỏi gs (`m5-2411-1`), khuyến
  nghị hàng riêng.
- Lược đồ mẫu + seed public hỏng sẵn — `m5-2411-2`.
- Ảnh tự thu (`photoUrls` ở `/v1/listings`, `photos.urls` ở `/:id`) là đường CDN của nguồn S01; có lộ tên miền nguồn hay
  không là câu của luật 6 cho riêng data-api — ghi Ngoài-n cho gs, không đổi ở hàng này.

## Đặc tả UX

Không có — hàng không chạm giao diện (bề mặt `api`, `docs`). Ghi `descope` «bỏ đặc-tả-UX» và «bỏ design-pass» trong sổ.
