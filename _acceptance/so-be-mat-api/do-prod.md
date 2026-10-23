# Đo trên bản thật sau merge — so-be-mat-api (NT4)

Dòng «sau merge» của mục «Đường đo» trong hợp đồng: thước «gọi /api/v1/offers không token theo đúng chế độ AU2», đo trên
prod sau deploy, chế độ chỉ-đọc (`--chi-doc`: chỉ HTTP GET tin rao, không tạo phiên, không chạm DB, không gọi phương thức
ghi nào trên route Zalo/OpenClaw).

- Lúc đo: 2026-10-23T15:41:24Z · bản: `main` = `bf4145e` (merge PR #46), Vercel báo deploy `success`.
- Lệnh: `BASE_URL=https://onehub-invest.vercel.app OPS_API_TOKEN=<CLOUD_OPS_API_TOKEN từ ~/.oneinvest/cloud.env> node scripts/smoke-api-surface.mjs --chi-doc`
- Kết quả: `api-surface-smoke: ĐẠT`.

```
ok   offers khách: 401 {"error":"unauthorized"}
ok   offers bearer sai: 401
ok   offers bearer đúng: 200, khuôn generatedAt/kind/count/rows (200, 5 dòng)
```

Kèm một lời gọi beacon khách (`POST /api/v1/user-events`, thân `{}`, không phiên) → 204 — nhánh khách không ghi gì
(chế độ `session-or-noop`). Ảnh QR ở `/api/zalo-media` không đo trên prod: route trả 404 ở cloud (tệp chỉ có ở máy local).

Ngưỡng SỐNG của `opportunity.md` (offers theo chế độ AU2; khách không gây 401 ở beacon) đạt trên bản thật; hai thước còn
lại (route mới đọc sale_offers khai public → đỏ; ảnh QR không tải được) đo bằng bộ kiểm tĩnh và smoke local ở lượt chấm.
