---
schema_version: 2
feature_slug: can-gia-tot-cung-loai
verdict: BLOCKED
failed_evals: ["E1","E2","E3","E5","E6"]
reason: "Hai lệnh không xong trong trần 30 phút mặc định. (1) `bash pipeline/scripts/can-gia-cung-loai-db.sh do` (E7) chạy hơn 30 phút chưa có dòng kết thúc; tiến trình nền b6c3qsi0m vẫn chạy, verifier không có cách dừng và không chạy lại để tránh chạy song song; cần kiểm tay tệp đầu ra hoặc `ps`. (2) ui-check E8: bước 1 (`can-gia-cung-loai-db.sh ghi-thu` trên DB thử oneinvest_u1_cg8) không xong trong khoảng 30 phút; tiến trình anh em `do` (E7) dùng lại chính DB đó qua db-thu.sh (pg_dump | psql restore), restore dừng ở ALTER TABLE properties ADD CONSTRAINT properties_pkey (Lock, khoảng 24 phút) bị chặn bởi query refreshBaitGap của ghi-thu (khoảng 24 phút, bảng chưa có chỉ mục) — hai tiến trình khoá nhau, DB thử ở trạng thái nửa vỡ, không lấy được mã tin P1 để mở /ops/deals/<mã>; đã dừng tác vụ ghi-thu, không chụp frame nào. Ngoài ra lệnh `can-gia-cung-loai-db.sh itest` (E1, E2, E3, E5, E6) thất bại vì DB thử oneinvest_u1_cg8 không tồn tại tại thời điểm chạy (lỗi 3D000 từ Postgres) — có khả năng liên quan việc hai tiến trình E7/E8 dựng lại cùng DB này; cần chạy lại sau khi dọn tiến trình treo."
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: e40d831db82ada84d5b72221be28d10b4fe5fe92
human_signoff:
---

# Evidence Report: can-gia-tot-cung-loai

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | FAIL |
| E2 | AC-2 | script | FAIL |
| E3 | AC-3 | script | FAIL |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | script | FAIL |
| E6 | AC-6 | script | FAIL |
| E7 | AC-7 | script | BLOCKED |
| E8 | AC-8 | ui-check | BLOCKED |
| E9 | AC-9 | script | PASS |
| E10 | AC-10 | script | PASS |

Lệnh không gắn eval nào và thất bại: `bash pipeline/scripts/can-gia-cung-loai-db.sh itest` (phủ E1, E2, E3, E5, E6) — đã tính vào năm eval đó, không có lệnh thất bại mồ côi.

## Evidence

- eval: E1
  run_id: minted-can-gia-tot-cung-loai-E1-r1
  result: failed (lệnh itest thoát khác không, DB thử oneinvest_u1_cg8 không tồn tại)
  baseline: n-a
  verifier: config:executors.script.cg8_db
  verified_at: 2026-11-12T17:41:19Z
  output: |
    test at scripts/can-gia-cung-loai.itest.mjs:50:1
    CG8-AC-2 bảy ô không chấm, log đếm hai lý do; đối chứng dương có số — lỗi: database "oneinvest_u1_cg8" does not exist (code 3D000, routine InitPostgres)

- eval: E2
  run_id: minted-can-gia-tot-cung-loai-E2-r1
  result: failed (cùng lệnh itest, cùng nguyên nhân DB thử không tồn tại)
  baseline: n-a
  verifier: config:executors.script.cg8_db
  verified_at: 2026-11-12T17:41:19Z
  output: |
    database "oneinvest_u1_cg8" does not exist (code 3D000, routine InitPostgres)

- eval: E3
  run_id: minted-can-gia-tot-cung-loai-E3-r1
  result: failed (cùng lệnh itest, cùng nguyên nhân)
  baseline: n-a
  verifier: config:executors.script.cg8_db
  verified_at: 2026-11-12T17:41:19Z
  output: |
    database "oneinvest_u1_cg8" does not exist (code 3D000, routine InitPostgres)

- eval: E4
  run_id: minted-can-gia-tot-cung-loai-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.cg8_ham
  verified_at: 2026-11-12T17:41:19Z
  output: |
    ℹ duration_ms 101.8595
    (lệnh thoát 0)

- eval: E5
  run_id: minted-can-gia-tot-cung-loai-E5-r1
  result: failed (cùng lệnh itest, cùng nguyên nhân)
  baseline: n-a
  verifier: config:executors.script.cg8_db
  verified_at: 2026-11-12T17:41:19Z
  output: |
    database "oneinvest_u1_cg8" does not exist (code 3D000, routine InitPostgres)

- eval: E6
  run_id: minted-can-gia-tot-cung-loai-E6-r1
  result: failed (cùng lệnh itest, cùng nguyên nhân)
  baseline: n-a
  verifier: config:executors.script.cg8_db
  verified_at: 2026-11-12T17:41:19Z
  output: |
    database "oneinvest_u1_cg8" does not exist (code 3D000, routine InitPostgres)

- eval: E7
  run_id: minted-can-gia-tot-cung-loai-E7-r1
  result: blocked (không có kết quả)
  baseline: n-a
  verifier: config:executors.script.cg8_do
  verified_at: 2026-11-12T17:41:19Z
  output: |
    Lệnh chạy nguyên văn với timeout 600000 ms rồi chuyển sang nền (ID b6c3qsi0m). Poll khoảng 1800 giây liên tục, tệp đầu ra vẫn rỗng, chưa có dòng kết thúc. Không có mã thoát để báo cáo.

- eval: E8
  run_id: minted-can-gia-tot-cung-loai-E8-r1
  result: blocked (không chụp frame nào)
  baseline: n-a
  verifier: config:executors.ui-check
  verified_at: 2026-11-12T17:41:19Z
  observed: không có frame nào được lưu (E8-step1/2/3 không tạo), nên không có gì để mô tả; DB thử ở trạng thái nửa vỡ do restore đang dở.
  network_observed: n-a (driver)
  output: |
    Dev server :3460 đang chạy (next-server pid 2655, cwd là app của worktree); GET /ops/deals khi chưa đăng nhập trả chuyển hướng. ghi-thu bị chặn: pg_stat_activity thấy pid 2684988 (SELECT property_type, IO, khoảng 24 phút) chặn pid 2684810 (ALTER TABLE properties ADD CONSTRAINT properties_pkey, Lock, khoảng 24 phút); pg_blocking_pids xác nhận. Tiến trình `can-gia-cung-loai-db.sh do` + db-thu.sh oneinvest_u1_cg8 chạy song song từ 12:43.

- eval: E9
  run_id: minted-can-gia-tot-cung-loai-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cg8_ranh_gioi
  verified_at: 2026-11-12T17:41:19Z
  output: |
    KẾT: trong ranh giới

- eval: E10
  run_id: minted-can-gia-tot-cung-loai-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cg8_cloud_view
  verified_at: 2026-11-12T17:41:19Z
  output: |
    KẾT: khớp

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-can-gia-tot-cung-loai-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-12T17:41:19Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-can-gia-tot-cung-loai-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-12T17:41:19Z

- cmd: cd app && npm test
  run_id: minted-can-gia-tot-cung-loai-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-11-12T17:41:19Z

- cmd: cd pipeline && npm test
  run_id: minted-can-gia-tot-cung-loai-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-11-12T17:41:19Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-can-gia-tot-cung-loai-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-12T17:41:19Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-can-gia-tot-cung-loai-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-12T17:41:19Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đều không có baseline chạy được (n-a), không eval nào xanh ở cả hai phía.

Baseline khong do
- bash pipeline/scripts/can-gia-cung-loai-db.sh itest: bo qua baseline: tep pipeline/scripts/can-gia-cung-loai-db.sh co o cay dang kiem nhung chua co o merge-base c8bd5ddbffa630e4609d78f560ba776bb68ff292 — eval moi, chay tren code cu khong phan biet gi
- cd app && node --import tsx --test tests/can-gia-cung-loai.test.tsx: bo qua baseline: tep app/tests/can-gia-cung-loai.test.tsx co o cay dang kiem nhung chua co o merge-base c8bd5ddbffa630e4609d78f560ba776bb68ff292 — eval moi, chay tren code cu khong phan biet gi
- bash pipeline/scripts/can-gia-cung-loai-db.sh do: bo qua baseline: tep pipeline/scripts/can-gia-cung-loai-db.sh co o cay dang kiem nhung chua co o merge-base c8bd5ddbffa630e4609d78f560ba776bb68ff292 — eval moi, chay tren code cu khong phan biet gi
- node pipeline/scripts/can-gia-cung-loai-ranh-gioi.mjs --base origin/main: bo qua baseline: tep pipeline/scripts/can-gia-cung-loai-ranh-gioi.mjs co o cay dang kiem nhung chua co o merge-base c8bd5ddbffa630e4609d78f560ba776bb68ff292 — eval moi, chay tren code cu khong phan biet gi
- cd pipeline && node scripts/can-gia-cung-loai-cloud.mjs: bo qua baseline: tep pipeline/scripts/can-gia-cung-loai-cloud.mjs co o cay dang kiem nhung chua co o merge-base c8bd5ddbffa630e4609d78f560ba776bb68ff292 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — mọi eval nhiều lần chạy đều đồng nhất (mọi eval chạy một lần, không phương sai).

## Iterations

Round 1: E1, E2, E3, E5, E6 thất bại vì DB thử oneinvest_u1_cg8 không tồn tại khi chạy itest; E7 và E8 bị chặn do tiến trình `do` và `ghi-thu` khoá nhau trên cùng DB thử, vượt trần 30 phút. Cần dọn tiến trình treo, dựng lại DB thử rồi chạy lại với timeout dài hơn.
