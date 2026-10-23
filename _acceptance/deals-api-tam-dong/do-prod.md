# Đo trên bản thật sau merge — deals-api-tam-dong (AU2)

Dòng thứ hai của mục «Đường đo» trong hợp đồng: cùng thước «gọi không token: 401; gọi bằng token ops: 200», đo trên prod
sau deploy, chế độ chỉ-đọc (không tạo phiên, không chạm DB).

- Lúc đo: 2026-10-23T10:33:54Z · bản: `main` = `40b18d5` (merge PR #33), Vercel báo «Deployment has completed».
- Lệnh: `BASE_URL=https://onehub-invest.vercel.app OPS_API_TOKEN=<CLOUD_OPS_API_TOKEN từ ~/.oneinvest/cloud.env> node scripts/smoke-deals-api.mjs --chi-doc`
- Kết quả: `deals-api-smoke: ĐẠT`, exit 0.

```
ok   khách: 401 {"error":"unauthorized"}, không khoá data/meta (401 {"error":"unauthorized"})
ok   khách có query (?limit=5&min_discount=0): 401 (401)
ok   bearer sai: 401 (401)
ok   bearer đúng: 200, data là mảng, meta có total/minDiscount/ruler (200, 30 dòng)
```

Ngưỡng SỐNG của `opportunity.md` đạt trên bản thật. Ghi chú: lượt `curl` vài giây trước đó còn trả 200 — rơi đúng lúc Vercel
chuyển alias sang bản mới; lượt sau 401 với `x-vercel-cache: MISS`.

Ngoài phạm vi (không tính): project Vercel cũ `app` vẫn phục vụ bản 22/10 — audit Q2, việc của Mạnh.
