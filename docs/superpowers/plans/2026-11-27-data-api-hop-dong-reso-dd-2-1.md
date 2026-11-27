# PB2 — data-api theo RESO DD 2.1: kế hoạch thi công

Hồ sơ `_acceptance/data-api-hop-dong-reso-dd-2-1/` (Cổng Phạm vi Mạnh ký lần ba 27/11). T2 — không Cổng 1.5. Nền: gộp PB5 đã ký
(fc472587c, gồm main a83596627, PB3, HT19) — lược đồ mẫu AC-9 làm trên bản PB5 đã dọn tên nguồn. PB2 gộp cuối (sau HT20).

## Quyết định từ số đo (27/11, DB M5)

- `offer_id` tin bán/thuê dài hạn đã là mã mờ `offer_` + 16 hex → `listingKey` = `offer_id`. Tin ngắn hạn `abnb_<số>` là id
  nguồn → `listingKey` = 16 hex đầu `hmac('S01|' || id, khoá, 'sha256')` tính NGAY TRONG SQL (`pgcrypto` có ở DB máy thu; lược
  đồ mẫu tạo extension). Nhờ vậy sắp theo `listingKey` và phân trang chạy trên tập ghép hai bảng bằng một câu; tra
  `/:listingKey` là một câu (989 tin ngắn hạn) — không cần chỉ mục trong bộ nhớ (thay điều kiện (a) của gs bằng cách không DDL).
- Khoá bí mật: biến `LISTING_KEY_SECRET`. dev/test thiếu → khoá thử `khoa-thu-dev-KHONG-DUNG-THAT` (chữ lộ rõ là giả, gs (b)).
  Môi trường đóng thiếu → `src/index.ts` không khởi động (thông điệp ghim «PB2 thiếu khoá bí mật của listingKey»), route tin
  trả 503 cho lối vào không qua index.ts (Vercel) — cùng khuôn PB3.

## Task (tuần tự — chạm chung route, tệp hợp đồng)

| # | Việc | Tệp | Phục vụ |
|---|---|---|---|
| 1 | Tệp hợp đồng `LISTING_KEYS` (khoá · resource DD · field · extension · lý do) + bảng loại hình §3 | `data-api/src/contract/listing.ts` | E1–E5, E7, E13 |
| 2 | `/v1/listings` một tài nguyên ghép hai bảng: kind, market, area, bedroomsTotal, project, minBelowMedianPct, limit/offset; `/:listingKey`; ba khoá so giá (nhánh hạng / CG8) | `data-api/src/routes/listings.ts`, `src/lib/listing-key.ts` | E1–E5 |
| 3 | `/v1/deals` 410; `/v1/price-stats` (thân cũ của asset-stats), `/v1/asset-stats` 410; version 0.2.0; openapi sinh schema Listing | `routes/deals.ts`, `routes/asset-stats.ts`, `app.ts`, `index.ts` | E5, E11/E14 |
| 4 | Test DB thử: ma trận loại hình, HMAC, phân trang, hai nhánh so giá, đường 410; `dong-ba-route.test.ts` chuyển ca deals; ba test app chuyển lời gọi | `data-api/test/*`, `app/tests/{can-gia-cung-loai-db,hang-gia-doc,gia-tot-du-an-doc}.test.tsx` | E1–E6 |
| 5 | `mappings.yaml`: dd_version 2.1, ba ánh xạ canonical, mục listings, api_extensions.listing | `pipeline/mappings.yaml` | E7, E8 |
| 6 | Lược đồ mẫu AC-9: `data-api/db/schema.sql` + `seed.sql` (chờ GS về test PB5 ghim lược đồ mẫu cũ) | `data-api/db/`, `data-api/seed.sql` | E9 |
| 7 | README bảng tên cũ → mới, CLAUDE.md luật khoá; probe E6, E7, E9, E10; khoá lệnh `dapi_reso*` | `data-api/*.md`, `_acceptance/…/probes`, `_acceptance/config.yaml` | E6–E10 |
