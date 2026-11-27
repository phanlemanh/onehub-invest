# data-api/ — API công khai (Hono)

Mảnh này được `tools/sync-public.sh` đẩy NGUYÊN NỘI DUNG (git subtree) sang repo
public `onehub-data-api`. Mọi thứ trong thư mục này coi như công khai.

## Cấu trúc

```
src/app.ts            mount /v1/markets, /v1/listings, /v1/price-stats, /v1/coverage; /v1/deals, /v1/asset-stats trả 410
src/contract/listing.ts  danh sách khoá DUY NHẤT của phần tử Listing (RESO DD 2.1) — route, openapi, test đọc từ đây
src/routes/*.ts       mỗi nhóm một file
src/middleware/       auth.ts (Bearer/X-API-Key, DATA_API_KEYS; đóng mặc định — khoá trống chỉ mở khi NODE_ENV=development|test và không VERCEL, nơi khác 503 AUTH_NOT_CONFIGURED và index.ts không khởi động), error-handler.ts
src/db/client.ts      pg pool từ DATABASE_URL
db/schema.sql         lược đồ mẫu DUY NHẤT (PB2 AC-9): dựng mọi bảng/view route đọc trên DB rỗng; thêm bảng/cột route mới đọc thì thêm vào đây
seed.sql              dữ liệu mẫu cho người dùng repo public — không chèn dòng nào vào bảng S02
```

## Lệnh

```bash
npm install           # chưa cài sẵn trong monorepo
npm run typecheck
npm run dev           # :3001 (PORT)
# test listings (RESO), coverage, các đường cấm đọc — chạy từ gốc monorepo, trên DB thử có lược đồ thật:
#   bash db/db-thu.sh oneinvest_suite_dapi --chay sh -c 'cd data-api && node --import tsx --test --test-concurrency=1 test/*.test.ts'
```

## Luật

- **Không bao giờ** đưa vào đây: tên nguồn thật (SPL tầng A), SĐT, query đọc `sale_offers`
  thô, đường dẫn/hostname nội bộ, secret. Nguồn gọi bằng mã `S0x`.
- **Không đọc bảng `stg_*` thô** (bài, tin chưa qua transform) ở bất kỳ route nào — chỉ đọc lớp canonical và bảng tính sẵn.
- **Không đọc bảng S02** và không trả số, ảnh hay đường dẫn nào suy từ S02: S02 chỉ để hiệu chuẩn, chỉ hiện ở cổng Ops
  (AGENTS.md luật 5).
- **Không trả chữ bài, ảnh, tên nhóm, tên người gửi của bài S03** — các thứ này chỉ hiện ở cổng Ops (AGENTS.md luật 6).
  Test `test/dong-ba-route.test.ts` cấy dòng canh vào các bảng cấm và đỏ khi một route đọc hay trả chúng; thêm route
  mới đọc tin, listing thì thêm ca vào tệp đó.
- Chỉ đọc bảng/view đã precompute; không tính metrics nặng lúc request.
- Đổi shape response → cập nhật `/openapi.json` và `docs/api/openapi.yaml` cùng lúc.
- **Khoá phần tử Listing chỉ thêm qua `src/contract/listing.ts`** (PB2): tra RESO Data Dictionary 2.1 trước
  (`research-local/reso/dd-2.1.json` của checkout chính); có field tương đương thì dùng đúng tên DD viết camelCase và giá
  trị `StandardName` của lookup; không có mới là extension, và extension phải khai mục `api_extensions.listing` trong
  `pipeline/mappings.yaml` đủ sáu điều kiện ADR-0011. Không đặt tên extension trùng một field DD khác nghĩa
  (`roomType` → `spaceType`). Listing = resource `Property` của RESO; danh bạ nhà là `/v1/properties`.
- Khoá `listingKey` của tin thuê ngắn hạn là HMAC có khoá bí mật `LISTING_KEY_SECRET` — không bao giờ trả id gốc của nguồn.
