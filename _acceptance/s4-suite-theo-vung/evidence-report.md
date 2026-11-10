---
schema_version: 2
feature_slug: s4-suite-theo-vung
verdict: REJECT
failed_evals: [E8]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 3be9e2468dde132d851d206c273fd0300a9958e9
human_signoff:
---

# Evidence Report: s4-suite-theo-vung

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |
| E8 | AC-8 | test | FAIL |

## Evidence

- eval: E1
  run_id: minted-s4-suite-theo-vung-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s4v_bo_qua
  verified_at: 2026-11-10T18:04:13Z
  output: |
    ℹ duration_ms 3034.92475

- eval: E2
  run_id: minted-s4-suite-theo-vung-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s4v_chay
  verified_at: 2026-11-10T18:04:13Z
  output: |
    ℹ duration_ms 5447.16325

- eval: E3
  run_id: minted-s4-suite-theo-vung-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s4v_keo
  verified_at: 2026-11-10T18:04:13Z
  output: |
    ℹ duration_ms 55.6415

- eval: E4
  run_id: minted-s4-suite-theo-vung-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s4v_bao_thu
  verified_at: 2026-11-10T18:04:13Z
  output: |
    ℹ duration_ms 4033.215833

- eval: E5
  run_id: minted-s4-suite-theo-vung-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s4v_phu
  verified_at: 2026-11-10T18:04:13Z
  output: |
    ℹ duration_ms 791.934083

- eval: E6
  run_id: minted-s4-suite-theo-vung-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s4v_cau_hinh
  verified_at: 2026-11-10T18:04:13Z
  output: |
    cau-hinh: xanh — chỉ suite_keys đổi; sáu lệnh cũ nguyên byte (gốc 490d7309392760cc8a63e63c036e0555e96f4bee)

- eval: E7
  run_id: minted-s4-suite-theo-vung-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s4v_dung_wt
  verified_at: 2026-11-10T18:04:13Z
  output: |
    ℹ duration_ms 3457.244417

- eval: E8
  run_id: minted-s4-suite-theo-vung-E8-r1
  exit_code: 1
  baseline: red
  verifier: config:executors.test.scripts
  verified_at: 2026-11-10T18:04:13Z
  output: |
    Lệnh `node --test scripts/*.test.mjs` đỏ. Ca đỏ: scripts/kiem-tin-rao-gan-khu-vuc.test.mjs dòng 24,
    assert.strictEqual: actual null, expected 0 (ERR_ASSERTION).
    Chạy trên DB thật của máy (79540 tin S06 nạp lượt này), ngoài phạm vi sửa của feature này.

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-s4-suite-theo-vung-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r1
  exit_code: 0
  verified_at: 2026-11-10T18:04:13Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-s4-suite-theo-vung-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-10T18:04:13Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-s4-suite-theo-vung-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r1
  exit_code: 0
  verified_at: 2026-11-10T18:04:13Z

- cmd: node scripts/suite-neu-doi.mjs pipeline -- 'cd pipeline && npm test'
  run_id: minted-s4-suite-theo-vung-SUITE-node_scripts_suite_neu_doi_mjs_pipeline_-r1
  exit_code: 0
  verified_at: 2026-11-10T18:04:13Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-s4-suite-theo-vung-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-10T18:04:13Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-s4-suite-theo-vung-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r1
  exit_code: 0
  verified_at: 2026-11-10T18:04:13Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đều red trên baseline (có phân biệt) — riêng các eval mới E1–E7 không đo được baseline (xem dưới); E8 là regression-guard của cả bộ test scripts, baseline red.

Lệnh fail không gắn riêng eval: `node --test scripts/*.test.mjs` gắn với E8 (chính là lệnh của E8).

Baseline không đo

- node --test --test-name-pattern=S4V-AC-1 scripts/suite-neu-doi.test.mjs: bo qua baseline: tep scripts/suite-neu-doi.test.mjs co o cay dang kiem nhung chua co o merge-base 490d7309392760cc8a63e63c036e0555e96f4bee — eval moi, chay tren code cu khong phan biet gi
- node --test --test-name-pattern=S4V-AC-2 scripts/suite-neu-doi.test.mjs: bo qua baseline: tep scripts/suite-neu-doi.test.mjs co o cay dang kiem nhung chua co o merge-base 490d7309392760cc8a63e63c036e0555e96f4bee — eval moi, chay tren code cu khong phan biet gi
- node --test --test-name-pattern=S4V-AC-3 scripts/suite-neu-doi.test.mjs: bo qua baseline: tep scripts/suite-neu-doi.test.mjs co o cay dang kiem nhung chua co o merge-base 490d7309392760cc8a63e63c036e0555e96f4bee — eval moi, chay tren code cu khong phan biet gi
- node --test --test-name-pattern=S4V-AC-4 scripts/suite-neu-doi.test.mjs: bo qua baseline: tep scripts/suite-neu-doi.test.mjs co o cay dang kiem nhung chua co o merge-base 490d7309392760cc8a63e63c036e0555e96f4bee — eval moi, chay tren code cu khong phan biet gi
- node --test --test-name-pattern=S4V-AC-5 scripts/suite-neu-doi.test.mjs: bo qua baseline: tep scripts/suite-neu-doi.test.mjs co o cay dang kiem nhung chua co o merge-base 490d7309392760cc8a63e63c036e0555e96f4bee — eval moi, chay tren code cu khong phan biet gi
- node --test --test-name-pattern=S4V-AC-6 scripts/suite-neu-doi.test.mjs && bash _acceptance/s4-suite-theo-vung/probes/cau-hinh-khong-doi.sh: bo qua baseline: tep scripts/suite-neu-doi.test.mjs co o cay dang kiem nhung chua co o merge-base 490d7309392760cc8a63e63c036e0555e96f4bee — eval moi, chay tren code cu khong phan biet gi
- node --test scripts/dung-worktree-cham.test.mjs: bo qua baseline: tep scripts/dung-worktree-cham.test.mjs co o cay dang kiem nhung chua co o merge-base 490d7309392760cc8a63e63c036e0555e96f4bee — eval moi, chay tren code cu khong phan biet gi

## Variance

none — mọi eval multi-run đều đồng nhất (không eval nào chạy nhiều lần)

## Iterations

Round 1: E8 failed — `node --test scripts/*.test.mjs` đỏ ở scripts/kiem-tin-rao-gan-khu-vuc.test.mjs (null so với 0, dòng 24). Returned to implementation.
