# Chạy thử trên bản sao — 18/11/2026, nhánh @4d1759d24 (script ZCode 7cb255c24)

Mọi ca chạy bản sao script trong thư mục tạm, fixture thay bước pipeline, DB trỏ cổng đóng (không đụng DB máy thu).

| Lệnh | Kết quả |
|---|---|
| `node --test --test-concurrency=1 scripts/zalo-import-tran.test.mjs` | 23/23 đạt (AC-1..AC-7, kể cả bảy ca chiều đỏ) |
| cùng lệnh, `HOME` tạm không có `~/.local/node-v24.21.0` (như CI) | 23/23 đạt |
| đối chứng: cùng tệp test, script @99b2778e9 (LL đo 18/11) | đỏ đúng AC-4(a) đồng hồ mồ côi và AC-5 TERM trúng người gọi |
| lưới job cũ (job-step-thoi-luong, job-exit, s03-nap-nhanh, zalo-import-job, -nhe, enrich-buoc-job, -lan) | 139/139 đạt |
| `NODE_OPTIONS=$(node scripts/lib/ci-can-du-lieu.mjs scripts) node --test scripts/*.test.mjs` | 566 đạt, 0 đỏ (568 ca) |
| tiến trình thử còn sót sau các lượt (`ps … | grep zalo-tran-`) | 0 |
