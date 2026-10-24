# Kế hoạch — cloud-sync-bao-loi-that (AU13, T3)

Hợp đồng: `_acceptance/cloud-sync-bao-loi-that/contract.md` (Cổng Phạm vi duyệt 24/10). Design:
`docs/superpowers/specs/2026-10-24-cloud-sync-bao-loi-that-design.md`. Ba task, tuần tự.

| Người dùng thấy gì khác | Đụng đâu | Phục vụ tiêu chí |
|---|---|---|
| Lượt đồng bộ cloud báo lỗi khi bước nào hỏng; log có dòng `JOB FAIL [cloud-sync] …` | `scripts/cloud-sync.sh` | AC-1, AC-2 (báo lỗi thật) |
| Bước đẩy số Ops nối DB theo cấu hình như mọi bước khác | `pipeline/push-ops-facts.mjs` (một dòng) | AC-4, AC-5 (đo được khi DB chết) |
| Phép thử chứng cả chiều đỏ, chạy như launchd | `scripts/job-exit.test.mjs` | AC-1…AC-5 |
| Người vận hành biết đọc dòng báo lỗi cloud-sync | `docs/ops/runtime-map.md`, `docs/ROADMAP.md` | AC-6 (sổ vận hành) |

## Task 1 — tệp bọc và chuỗi kết nối

- Files: `scripts/cloud-sync.sh`, `pipeline/push-ops-facts.mjs`.
- `cloud-sync.sh`: `. "$ROOT/scripts/lib/job-step.sh"` (đường tuyệt đối từ `ROOT`), hai dòng
  `job_run cloud-sync sync-cloud node "$ROOT/pipeline/sync-cloud.mjs"` và
  `job_run cloud-sync push-ops-facts node "$ROOT/pipeline/push-ops-facts.mjs"`, kết `exit "$JOB_RC"`.
- `push-ops-facts.mjs` dòng 13: `const LOCAL_URL = process.env.DATABASE_URL ?? <chuỗi cũ>;` — không đổi gì khác.
- Verify: `bash -n scripts/cloud-sync.sh`, `node --check pipeline/push-ops-facts.mjs`. `independent: false`.

## Task 2 — lật hai ô todo P3-3 thành ca thật

- Files: `scripts/job-exit.test.mjs`.
- `JOBS["cloud-sync"].tree.copy` thêm `scripts/lib/job-step.sh` (ma trận AC-3 cũ: lành → 0, DB tắt hẳn → ≠0 vẫn xanh).
- Ô «AC-3 cloud-sync · chập chờn» bỏ `todo`, kiểm bằng `problemsContinueOnFail` (≠0, đúng một dòng ghim, dãy đủ hai bước).
- Khối mới «AU13 cloud-sync»: push-ops-facts hỏng → ≠0, dòng ghim, dãy đủ; hai bước hỏng 3/5 → thoát 3, hai dòng ghim đúng
  thứ tự; gọi kiểu launchd — symlink tới gốc cây tạm, `cwd` = thư mục khác (`/`) → cùng kết quả ô chập chờn; hai bản
  đột biến bỏ `job_run` (dùng `mutateDropGuard`, thêm khẳng định văn bản khác gốc) → bị bắt, thông điệp gọi tên bước.
- AC-5 của AU3: `push-ops-facts` vào `STEPS` (11 bước), bỏ ô `todo`; ca đếm «đủ 11 bước»; chiều đỏ: bản sao push-ops-facts
  viết cứng `localhost:5433` (cùng khuôn `mutate`, nguồn là push-ops-facts) → bị bắt; ca «vắng DATABASE_URL» → hộp cát
  chặn `:5433`, cổng canh không thấy.
- Verify: `node --test scripts/*.test.mjs` xanh; phá-thử: chạy test trên `cloud-sync.sh` gốc (trước vòng) → ô chập chờn
  đỏ với thông điệp ghim. `independent: false`.

## Task 3 — tài liệu

- Files: `docs/ops/runtime-map.md` (mục job đêm: P3-3 đã vá), `docs/ROADMAP.md` (một dòng).
- Verify: đối chiếu bốn điều của E6 với `cloud-sync.sh`, `job-step.sh`, `push-ops-facts.mjs`. `independent: true`, làm cuối.
