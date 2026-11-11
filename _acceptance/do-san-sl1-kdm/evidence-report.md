---
schema_version: 2
feature_slug: do-san-sl1-kdm
verdict: REJECT
failed_evals: ["E5"]
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: c5dcc1396928064ae2f4c077a2b4430d42ba8607
human_signoff:
---

# Evidence Report: do-san-sl1-kdm

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS (carry-forward từ round 1) |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | test | FAIL |

Lệnh fail không gắn eval nào khác: `node --test scripts/*.test.mjs` thuộc E5 (không có lệnh fail mồ côi).

## Evidence

- eval: E1
  run_id: minted-do-san-sl1-kdm-E1-r1
  exit_code: 0
  carried_from_round: 1
  verifier: config:executors.test.dsk_doc
  verified_at: 2026-11-10T23:16:17Z
  note: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E2
  run_id: minted-do-san-sl1-kdm-E2-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.test.dsk_vi_tu
  verified_at: 2026-11-11T00:17:08Z
  output: |
    ℹ duration_ms 534.511625

- eval: E3
  run_id: minted-do-san-sl1-kdm-E3-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.test.tin_rao_gan_do_test
  verified_at: 2026-11-11T00:17:08Z
  output: |
    ℹ duration_ms 1389216.510833

- eval: E4
  run_id: minted-do-san-sl1-kdm-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dsk_khong_db_chung
  verified_at: 2026-11-11T00:17:08Z
  output: |
    khong-db-chung: xanh

- eval: E5
  run_id: minted-do-san-sl1-kdm-E5-r2
  exit_code: 1
  baseline: red
  verifier: config:executors.test.scripts
  verified_at: 2026-11-11T00:17:08Z
  output: |
    Các ca AU11-AC-3 trong scripts/ci-test-module.test.mjs (migration giả lỗi gọi tên tệp; DB đã có bảng thì từ chối; migration trong danh sách đã khai mà áp xanh) đỏ với lỗi "Connection terminated unexpectedly" từ pg (app/node_modules/pg), kèm một assert strictEqual actual 1 expected 0 ở ca cùng tệp.

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-do-san-sl1-kdm-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-11-11T00:17:08Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-do-san-sl1-kdm-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-11T00:17:08Z

- cmd: cd app && npm test
  run_id: minted-do-san-sl1-kdm-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-11-11T00:17:08Z

- cmd: cd pipeline && npm test
  run_id: minted-do-san-sl1-kdm-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-11-11T00:17:08Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-do-san-sl1-kdm-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-11T00:17:08Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-do-san-sl1-kdm-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-11-11T00:17:08Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đo được đều red trên baseline (có phân biệt)

Baseline không đo:
- bash _acceptance/do-san-sl1-kdm/probes/khong-db-chung.sh: bo qua baseline: tep _acceptance/do-san-sl1-kdm/probes/khong-db-chung.sh co o cay dang kiem nhung chua co o merge-base 610074bf51f6e2427b3fdbda37e33def7dec3d53 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — mọi eval multi-run đều đồng nhất (không eval nào có runs > 1)

## Iterations

Round 1: REJECT — hồ sơ vòng 1 (commit c5dcc139); E1 sau đó được mang sang round 2 vì delta không chạm paths của nó.
Round 2: E5 failed — `node --test scripts/*.test.mjs` đỏ ở các ca AU11-AC-3 của scripts/ci-test-module.test.mjs (kết nối pg bị ngắt đột ngột). E2, E3, E4 xanh. Returned to implementation.
