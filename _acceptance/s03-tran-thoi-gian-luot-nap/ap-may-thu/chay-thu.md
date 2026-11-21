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

## Lượt S4 r3 — 21/11/2026, nhánh @3f597c5d8 (đã nhận main 3c529c0b4)

Chạy kiểu CI trước s4 (`env -i`, HOME tạm không có `~/.local/node-v24.21.0`, DB thử `db/db-thu.sh … --chay`), rồi S4 r3
chấm lại trên cùng sha: PASS 14/14 eval.

| Lệnh | Kết quả |
|---|---|
| `node --test --test-concurrency=1 scripts/zalo-import-tran.test.mjs` (E8e) | 26/26 đạt |
| lưới job cũ E8b (job-exit, s03-nap-nhanh, zalo-import-job, -nhe, enrich-buoc-job) | 118/118 đạt |
| trọn `scripts/enrich-buoc-job.test.mjs` | 11/11 đạt |
| `scripts/zalo-import-job-lan.test.mjs` (E8d) | 4/4 đạt |
| trọn `scripts/*.test.mjs` (E8f) | 572 đạt, 3 đỏ `install-cron-chi` do bộ chạy macOS thiếu docker (ca tự bỏ trên CI ubuntu); chạy lại có docker: 5/5 |
| phép kiểm 5b của README trên log giả (một lượt TẮT ở log 15′, một lượt WARN+TIMEOUT ở log 00:00, dòng cũ trước mốc byte) | `s03-nap-15phut.log luot=1 tat=1 warn=0 cat=0` · `zalo-import.log luot=1 tat=0 warn=1 cat=1` — dòng trước mốc không đếm |
| phép kiểm 5c (`pgrep -f 'process.env.NHAN_CANH'`) trên một `node -e` nhiều dòng mang chuỗi ấy | đang chạy: 1 · sau khi thoát: 0 |
