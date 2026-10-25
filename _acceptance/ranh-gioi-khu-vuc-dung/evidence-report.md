---
schema_version: 2
feature_slug: ranh-gioi-khu-vuc-dung
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: c476c6cbaa999014068261d8f7384d97da472415
human_signoff:
---

# Evidence Report: ranh-gioi-khu-vuc-dung

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | test | PASS |
| E9 | AC-9 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-ranh-gioi-khu-vuc-dung-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.reassign_areas
  verified_at: 2026-10-25T14:33:49Z
  output: |
    cmd: cd pipeline && node --test scripts/reassign-areas.test.mjs
    ℹ duration_ms 7125.991125

- eval: E2
  run_id: minted-ranh-gioi-khu-vuc-dung-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.reassign_areas
  verified_at: 2026-10-25T14:33:49Z
  output: |
    cmd: cd pipeline && node --test scripts/reassign-areas.test.mjs
    ℹ duration_ms 7125.991125

- eval: E3
  run_id: minted-ranh-gioi-khu-vuc-dung-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.reassign_areas
  verified_at: 2026-10-25T14:33:49Z
  output: |
    cmd: cd pipeline && node --test scripts/reassign-areas.test.mjs
    ℹ duration_ms 7125.991125

- eval: E4
  run_id: minted-ranh-gioi-khu-vuc-dung-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.reassign_areas
  verified_at: 2026-10-25T14:33:49Z
  output: |
    cmd: cd pipeline && node --test scripts/reassign-areas.test.mjs
    ℹ duration_ms 7125.991125

- eval: E5
  run_id: minted-ranh-gioi-khu-vuc-dung-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.reassign_areas
  verified_at: 2026-10-25T14:33:49Z
  output: |
    cmd: cd pipeline && node --test scripts/reassign-areas.test.mjs
    ℹ duration_ms 7125.991125

- eval: E6
  run_id: minted-ranh-gioi-khu-vuc-dung-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ranh_gioi_do
  verified_at: 2026-10-25T14:33:49Z
  output: |
    cmd: node scripts/kiem-ranh-gioi-khu-vuc.mjs --thu
    kiem-ranh-gioi: PASS

- eval: E7
  run_id: minted-ranh-gioi-khu-vuc-dung-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ranh_gioi_do
  verified_at: 2026-10-25T14:33:49Z
  output: |
    cmd: node scripts/kiem-ranh-gioi-khu-vuc.mjs --thu
    kiem-ranh-gioi: PASS

- eval: E8
  run_id: minted-ranh-gioi-khu-vuc-dung-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.finder_ranh_gioi
  verified_at: 2026-10-25T14:33:49Z
  output: |
    cmd: cd app && node --import tsx --test tests/finder-ranh-gioi.test.tsx
    ℹ duration_ms 1556.390083

- eval: E9
  run_id: minted-ranh-gioi-khu-vuc-dung-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.reassign_areas
  verified_at: 2026-10-25T14:33:49Z
  output: |
    cmd: cd pipeline && node --test scripts/reassign-areas.test.mjs
    ℹ duration_ms 7125.991125

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-ranh-gioi-khu-vuc-dung-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-10-25T14:33:49Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-ranh-gioi-khu-vuc-dung-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-10-25T14:33:49Z

- cmd: cd app && npm test
  run_id: minted-ranh-gioi-khu-vuc-dung-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-10-25T14:33:49Z

- cmd: cd pipeline && npm test
  run_id: minted-ranh-gioi-khu-vuc-dung-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-10-25T14:33:49Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-ranh-gioi-khu-vuc-dung-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-10-25T14:33:49Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-ranh-gioi-khu-vuc-dung-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-10-25T14:33:49Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»

Danh sách eval không-phân-biệt: không đo được ở round này vì baseline bị chặn ở hạ tầng (mọi field baseline là n-a). Không có kết luận «có phân biệt» hay «không phân biệt» cho eval nào.

Baseline khong do

- cd pipeline && node --test scripts/reassign-areas.test.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»
- node scripts/kiem-ranh-gioi-khu-vuc.mjs --thu: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»
- cd app && node --import tsx --test tests/finder-ranh-gioi.test.tsx: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»

## Variance

none — mọi eval chạy một lần, đều xác định, không có eval nhiều lượt chạy

## Iterations

Round 1: lịch sử round cũ do vòng trước giữ; báo cáo này thay toàn bộ nội dung bằng kết quả round 2.
Round 2: E1-E9 và sáu lệnh suite đều xanh trên cây c476c6cbaa999014068261d8f7384d97da472415; baseline không đo được (hạ tầng); không có mục chờ người chốt.

