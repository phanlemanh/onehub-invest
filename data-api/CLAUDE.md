# data-api/ — API công khai (Hono)

Mảnh này được `tools/sync-public.sh` đẩy NGUYÊN NỘI DUNG (git subtree) sang repo
public `onehub-data-api`. Mọi thứ trong thư mục này coi như công khai.

## Cấu trúc

```
src/app.ts            mount /v1/markets, /v1/listings, /v1/deals, /v1/asset-stats, /v1/coverage
src/routes/*.ts       mỗi nhóm một file
src/middleware/       auth.ts (Bearer, DATA_API_KEYS; trống = tắt auth khi dev), error-handler.ts
src/db/client.ts      pg pool từ DATABASE_URL
seed.sql, db/         dữ liệu mẫu cho người dùng repo public
```

## Lệnh

```bash
npm install           # chưa cài sẵn trong monorepo
npm run typecheck
npm run dev           # :3001 (PORT)
```

## Luật

- **Không bao giờ** đưa vào đây: tên nguồn thật (SPL tầng A), SĐT, query đọc `sale_offers`
  thô, đường dẫn/hostname nội bộ, secret. Nguồn gọi bằng mã `S0x`.
- Chỉ đọc bảng/view đã precompute; không tính metrics nặng lúc request.
- Đổi shape response → cập nhật `/openapi.json` và `docs/api/openapi.yaml` cùng lúc.
