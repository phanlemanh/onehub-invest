---
schema_version: 2
feature_slug: db-tu-khoi-dong
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 40fb80901c8aa5b74a784c34b168173960a18231
human_signoff: Mạnh 2026-10-23
---

# Evidence Report: db-tu-khoi-dong

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | judgment | PASS |
| E8 | AC-1 | script | PASS |
| E9 | AC-5 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-db-tu-khoi-dong-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.db_autostart_static
  verified_at: 2026-10-23T09:50:19Z
  output: |
    check-db-autostart static: ĐẠT

- eval: E2
  run_id: minted-db-tu-khoi-dong-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.db_autostart_mutation
  verified_at: 2026-10-23T09:50:19Z
  output: |
    check-db-autostart mutation: ĐẠT

- eval: E3
  run_id: minted-db-tu-khoi-dong-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.db_autostart_restart
  verified_at: 2026-10-23T09:50:19Z
  output: |
    check-db-autostart restart: ĐẠT

- eval: E4
  run_id: minted-db-tu-khoi-dong-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.db_autostart_restart
  verified_at: 2026-10-23T09:50:19Z
  output: |
    check-db-autostart restart: ĐẠT

- eval: E5
  run_id: minted-db-tu-khoi-dong-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.db_autostart_live
  verified_at: 2026-10-23T09:50:19Z
  output: |
    check-db-autostart live: ĐẠT

- eval: E6
  run_id: minted-db-tu-khoi-dong-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.db_autostart_cleanup
  verified_at: 2026-10-23T09:50:19Z
  output: |
    check-db-autostart cleanup: ĐẠT

- eval: E8
  run_id: minted-db-tu-khoi-dong-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.db_autostart_diff
  verified_at: 2026-10-23T09:50:19Z
  output: |
    check-db-autostart diff: ĐẠT

- eval: E9
  run_id: minted-db-tu-khoi-dong-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.db_autostart_live_selftest
  verified_at: 2026-10-23T09:50:19Z
  output: |
    check-db-autostart live-selftest: ĐẠT

### Judgment (E7) — đề xuất của hội đồng, chờ người chốt ở Cổng 2

- eval: E7
  judged_by: judge-subagent (fresh context), hội đồng ba lăng kính
  verdict: PASS
  rationale: Mục «DB local tự khởi động» trong docs/ops/runtime-map.md (dòng 106-134) có đủ năm điều; lệnh và policy trong tài liệu khớp compose và script.
  verified_at: 2026-10-23T09:50:19Z
  panel_votes:
    - domain-correctness: PASS — Mục «DB local tự khởi động» (runtime-map.md dòng 106-134) có đủ năm điều. (1) Chuỗi đăng nhập macOS → LaunchAgent homebrew.mxcl.colima → VM colima → dockerd → one-invest-db, và `restart: unless-stopped` trong tài liệu trùng dòng 7 của compose. (2) Lệnh `bash scripts/check-db-autostart.sh live` có thật: nhánh `live` trong script kiểm policy, status, RunAtLoad và launchctl, khớp mô tả. (3) Triển khai sau merge nói rõ không cần tạo lại container ngay, lần `docker compose up -d` kế tiếp tự tạo lại, DB gián đoạn vài giây. (4) Giới hạn nêu cần đăng nhập macOS và `docker stop` có chủ đích thì không tự bật lại. (5) Không câu nào bảo tạo lại container ngay; tài liệu ghi rõ agent không tự khởi động lại colima hay Docker của máy.
    - operational-feasibility: PASS — Mục «DB local tự khởi động» (runtime-map.md dòng 106-134) có đủ năm điều. Chuỗi đăng nhập → LaunchAgent colima → dockerd → `restart: unless-stopped` trùng giá trị ở compose dòng 7. Chế độ `live` có thật trong script (case dòng 251). Phần triển khai sau merge nói rõ «KHÔNG cần tạo lại container ngay», lần compose up kế tiếp tự tạo lại và DB gián đoạn vài giây. Giới hạn nêu đủ cần đăng nhập macOS và `docker stop` có chủ đích thì không tự bật. Không câu nào bảo tạo lại ngay, và tài liệu ghi «agent không tự khởi động lại colima hay Docker của máy».
    - spec-alignment: PASS — Mục «DB local tự khởi động» (runtime-map.md dòng 106–134) có đủ năm điều. Chuỗi đăng nhập → LaunchAgent homebrew.mxcl.colima → dockerd → `restart: unless-stopped` khớp `db/docker-compose.yml` dòng 7. Chế độ `live` có thật trong script (case `live`, đọc policy, RunAtLoad và launchctl). Phần triển khai và giới hạn đúng ý, và không câu nào bảo tạo lại container ngay hay bảo agent tự khởi động lại colima/Docker.
  human_override:  # chi nguoi ghi

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-db-tu-khoi-dong-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-10-23T09:50:19Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-db-tu-khoi-dong-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-10-23T09:50:19Z

- cmd: cd app && npm test
  run_id: minted-db-tu-khoi-dong-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-10-23T09:50:19Z

- cmd: cd pipeline && npm test
  run_id: minted-db-tu-khoi-dong-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-10-23T09:50:19Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-db-tu-khoi-dong-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-10-23T09:50:19Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-db-tu-khoi-dong-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-10-23T09:50:19Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — không eval feature nào được đo là xanh ở cả HEAD lẫn baseline; baseline của các eval feature đều là n-a (chưa đo, lý do ở mục dưới), nên chưa có chứng cứ red/green từ baseline.

Baseline khong do

- bash scripts/check-db-autostart.sh static: bo qua baseline: tep scripts/check-db-autostart.sh co o cay dang kiem nhung chua co o merge-base f3cff1f034d9d9365c0e049a4108240e2bcc5db0 — eval moi, chay tren code cu khong phan biet gi
- bash scripts/check-db-autostart.sh mutation: bo qua baseline: tep scripts/check-db-autostart.sh co o cay dang kiem nhung chua co o merge-base f3cff1f034d9d9365c0e049a4108240e2bcc5db0 — eval moi, chay tren code cu khong phan biet gi
- bash scripts/check-db-autostart.sh restart: bo qua baseline: tep scripts/check-db-autostart.sh co o cay dang kiem nhung chua co o merge-base f3cff1f034d9d9365c0e049a4108240e2bcc5db0 — eval moi, chay tren code cu khong phan biet gi
- bash scripts/check-db-autostart.sh live: bo qua baseline: tep scripts/check-db-autostart.sh co o cay dang kiem nhung chua co o merge-base f3cff1f034d9d9365c0e049a4108240e2bcc5db0 — eval moi, chay tren code cu khong phan biet gi
- bash scripts/check-db-autostart.sh cleanup: bo qua baseline: tep scripts/check-db-autostart.sh co o cay dang kiem nhung chua co o merge-base f3cff1f034d9d9365c0e049a4108240e2bcc5db0 — eval moi, chay tren code cu khong phan biet gi
- bash scripts/check-db-autostart.sh diff: bo qua baseline: tep scripts/check-db-autostart.sh co o cay dang kiem nhung chua co o merge-base f3cff1f034d9d9365c0e049a4108240e2bcc5db0 — eval moi, chay tren code cu khong phan biet gi
- bash scripts/check-db-autostart.sh live-selftest: bo qua baseline: tep scripts/check-db-autostart.sh co o cay dang kiem nhung chua co o merge-base f3cff1f034d9d9365c0e049a4108240e2bcc5db0 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform (mọi eval chạy một lần, tất định)

## Iterations

Round 1: E1-E6, E8, E9 đạt; E7 hội đồng đề xuất PASS; có 1 finding trong hợp đồng (AC-6, dọn dind khi lượt lỗi thoát bằng return) và 2 finding ngoài hợp đồng.
Round 2: E1-E6, E8, E9 đạt trên commit 40fb809 sau khi sửa AC-6 (chờ dockerd trong dind tới 120 giây, dọn dind cả khi lỗi thoát bằng return); E7 hội đồng đề xuất PASS; không còn finding trong hợp đồng, 2 finding ngoài hợp đồng giữ nguyên từ round 1.
