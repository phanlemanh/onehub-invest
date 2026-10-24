# Kế hoạch — job-bao-loi-that (AU3, T2)

Contract: `_acceptance/job-bao-loi-that/contract.md` (duyệt 23/10). Design: `docs/superpowers/specs/2026-10-23-job-bao-loi-that-design.md`.
Mọi task cùng một tệp test (`scripts/job-exit.test.mjs`) → tuần tự, `independent: false`.

| Người dùng thấy gì khác | Đụng đâu | Phục vụ tiêu chí |
|---|---|---|
| Log job có một dòng nêu job, bước, mã lỗi | `scripts/lib/job-step.sh` | AC-6 (bộ chạy bước) |
| Job Chợ Tốt / Facebook báo hỏng khi bước biến đổi hỏng giữa chừng | `scripts/chotot-daily.sh`, `scripts/apify-facebook-daily.sh` (đoạn transform) | AC-1, AC-2 (job báo hỏng thật) |
| Cả năm job được chứng minh báo hỏng khi DB tắt | `scripts/job-exit.test.mjs` | AC-3, AC-4 (ma trận job) |
| Từng bước xử lý được chứng minh báo hỏng, không đụng DB thật | `scripts/job-exit.test.mjs`, `scripts/lib/job-exit-sandbox.mjs` | AC-5 (bước thật) |
| Người vận hành biết job nào báo gì, lỗ nào còn chờ ai | `docs/ops/runtime-map.md` | AC-7 (tài liệu) |

## T1 — bộ chạy bước
- Files: `scripts/lib/job-step.sh`, `scripts/job-exit.test.mjs` (ca AC-6).
- Verify: `node --test scripts/job-exit.test.mjs`; phá thử: đổi mã trả về thành 0 → ca AC-6 đỏ.
- Phục vụ E6. `independent: false`.

## T2 — đoạn transform của hai job
- Files: `scripts/chotot-daily.sh`, `scripts/apify-facebook-daily.sh` (chỉ từ dòng transform đầu trở xuống), test AC-1/AC-2.
- Đoạn: `source lib/job-step.sh`; `RC=0`; mỗi bước `job_step <job> <bước> node … || RC=${RC:-…}` (giữ mã hỏng đầu); cuối `exit $RC`.
- Verify: test AC-1/AC-2 + ca đột biến (bản sao bỏ ghi mã → hàm kiểm trả lỗi nêu tên bước); `bash -n`.
- Phục vụ E1, E2. `independent: false`.

## T3 — ma trận năm job
- Files: `scripts/job-exit.test.mjs` (ca AC-3, AC-4; cây tạm + node/docker giả). Không đổi `airdna-daily.sh`, `finalize-hanoi.sh`, `cloud-sync.sh`.
- Verify: ca đếm «đủ 10 ca»; ca todo cloud-sync chập chờn (Hỏi-1 A → mã P3-3).
- Phục vụ E3, E4. `independent: false`.

## T4 — bước thật trong hộp cát
- Files: `scripts/lib/job-exit-sandbox.mjs` (nạp bằng `node --import`: chặn TCP ngoài cổng canh, chặn `fetch`), test AC-5.
- Verify: 10 ca + ca đếm + todo push-ops-facts; hai chiều đỏ (bản sao nuốt lỗi; bản sao viết cứng localhost:5433).
- Phục vụ E5. `independent: false`.

## T5 — tài liệu
- Files: `docs/ops/runtime-map.md` (mục «Job đêm báo lỗi thật»). ROADMAP §4 không sửa: trạng thái hàng máy suy từ `_acceptance/`; §2.4 «Chạy đêm» là phần của ZCode.
- Phục vụ E7. `independent: false`.
