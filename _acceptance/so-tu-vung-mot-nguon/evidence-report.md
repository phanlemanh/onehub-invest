---
schema_version: 2
feature_slug: so-tu-vung-mot-nguon
verdict: REJECT
failed_evals: [E6c]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 78ccc881d0c950605a02453a87272b0669541a71
human_signoff:
---

# Evidence Report: so-tu-vung-mot-nguon

Round 1. Có 1 eval đỏ (E6c); 15 eval còn lại xanh.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E3b | AC-3 | script | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | script | PASS |
| E5b | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E6b | AC-6 | test | PASS |
| E6c | AC-6 | test | FAIL |
| E6d | AC-6 | test | PASS |
| E6e | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |
| E8 | AC-8 | test | PASS |
| E8b | AC-8 | script | PASS |
| E9 | AC-9 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-so-tu-vung-mot-nguon-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.vocab
  verified_at: 2026-10-26T02:21:18Z
  output: |
    cd pipeline && node --test scripts/vocab.test.mjs scripts/vocab-lint.test.mjs
    ℹ duration_ms 2718.539292

- eval: E2
  run_id: minted-so-tu-vung-mot-nguon-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.vocab
  verified_at: 2026-10-26T02:21:18Z
  output: |
    cd pipeline && node --test scripts/vocab.test.mjs scripts/vocab-lint.test.mjs
    ℹ duration_ms 2718.539292

- eval: E3
  run_id: minted-so-tu-vung-mot-nguon-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.vocab
  verified_at: 2026-10-26T02:21:18Z
  output: |
    cd pipeline && node --test scripts/vocab.test.mjs scripts/vocab-lint.test.mjs
    ℹ duration_ms 2718.539292

- eval: E3b
  run_id: minted-so-tu-vung-mot-nguon-E3b-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.vocab_check
  verified_at: 2026-10-26T02:21:18Z
  output: |
    node pipeline/vocab.mjs --check
    vocab --check: 4/4 đích khớp sổ

- eval: E4
  run_id: minted-so-tu-vung-mot-nguon-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.vocab
  verified_at: 2026-10-26T02:21:18Z
  output: |
    cd pipeline && node --test scripts/vocab.test.mjs scripts/vocab-lint.test.mjs
    ℹ duration_ms 2718.539292

- eval: E5
  run_id: minted-so-tu-vung-mot-nguon-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.vocab_lint
  verified_at: 2026-10-26T02:21:18Z
  output: |
    node pipeline/vocab.mjs --lint
    vocab --lint: 0 chỗ viết tay ngoài sổ · ngoại lệ 8

- eval: E5b
  run_id: minted-so-tu-vung-mot-nguon-E5b-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.vocab
  verified_at: 2026-10-26T02:21:18Z
  output: |
    cd pipeline && node --test scripts/vocab.test.mjs scripts/vocab-lint.test.mjs
    ℹ duration_ms 2718.539292

- eval: E6
  run_id: minted-so-tu-vung-mot-nguon-E6-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-26T02:21:18Z
  output: |
    cd app && npm test
    ℹ duration_ms 36950.870333

- eval: E6b
  run_id: minted-so-tu-vung-mot-nguon-E6b-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-26T02:21:18Z
  output: |
    cd pipeline && npm test
    ℹ duration_ms 10768.546375

- eval: E6c
  run_id: minted-so-tu-vung-mot-nguon-E6c-r1
  exit_code: 1
  baseline: green
  verifier: config:executors.test.agent
  verified_at: 2026-10-26T02:21:18Z
  output: |
    cd agent && npm test
    ℹ tests 63 · pass 62 · fail 1
    ✖ AC-6 để sau: lượt backlog sau luôn mở lại thẻ, kể cả tin ngoài bộ lọc thiếu field
    AssertionError: AC-6 để sau không mở lại thẻ (0 !== 1)
    tại agent/tests/enrich-db.test.ts:475

- eval: E6d
  run_id: minted-so-tu-vung-mot-nguon-E6d-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.app
  verified_at: 2026-10-26T02:21:18Z
  output: |
    cd app && npx tsc --noEmit && npm run lint
    (không có lỗi tsc, không có lỗi lint)

- eval: E6e
  run_id: minted-so-tu-vung-mot-nguon-E6e-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.ui_lint_rules
  verified_at: 2026-10-26T02:21:18Z
  output: |
    cd app && npm run test:lint-rules
    ℹ duration_ms 192.558292

- eval: E7
  run_id: minted-so-tu-vung-mot-nguon-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.vocab_db
  verified_at: 2026-10-26T02:21:18Z
  output: |
    cd pipeline && node --test scripts/vocab-db.itest.mjs
    ℹ duration_ms 1101.404458

- eval: E8
  run_id: minted-so-tu-vung-mot-nguon-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.vocab_db
  verified_at: 2026-10-26T02:21:18Z
  output: |
    cd pipeline && node --test scripts/vocab-db.itest.mjs
    ℹ duration_ms 1101.404458

- eval: E8b
  run_id: minted-so-tu-vung-mot-nguon-E8b-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.vocab_db
  verified_at: 2026-10-26T02:21:18Z
  output: |
    node pipeline/vocab.mjs --check-db
    vocab --check-db: 6 cột · 39 lookup khớp sổ

- eval: E9
  run_id: minted-so-tu-vung-mot-nguon-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.vocab
  verified_at: 2026-10-26T02:21:18Z
  output: |
    cd pipeline && node --test scripts/vocab.test.mjs scripts/vocab-lint.test.mjs
    ℹ duration_ms 2718.539292

### Lệnh suite (hồi quy)

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-so-tu-vung-mot-nguon-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-26T02:21:18Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không-phân-biệt (xanh trên cả HEAD lẫn baseline, là regression-guard có chủ ý hoặc cần viết lại để assert hành vi mới):
- E6 (`cd app && npm test`)
- E6b (`cd pipeline && npm test`)
- E6e (`cd app && npm run test:lint-rules`)

Hồi quy: E6c (`cd agent && npm test`) xanh trên baseline nhưng đỏ trên HEAD. Chỉ một test đỏ: «AC-6 để sau» trong `agent/tests/enrich-db.test.ts` (dòng 462–475), khẳng định lượt backlog sau mở lại thẻ nhưng nhận 0 thay vì 1. Nguyên nhân gốc chưa được chẩn đoán trong round này. Với E6c không có eval nào khai judgment, nên không có hội đồng judge nào được chấm cho báo cáo này.

Baseline khong do:
- cd pipeline && node --test scripts/vocab.test.mjs scripts/vocab-lint.test.mjs: bo qua baseline: tep pipeline/scripts/vocab.test.mjs co o cay dang kiem nhung chua co o merge-base 106cbd3edb83f087b3cde91d6e1c00582b3451a5 — eval moi, chay tren code cu khong phan biet gi
- node pipeline/vocab.mjs --check: bo qua baseline: tep pipeline/vocab.mjs co o cay dang kiem nhung chua co o merge-base 106cbd3edb83f087b3cde91d6e1c00582b3451a5 — eval moi, chay tren code cu khong phan biet gi
- node pipeline/vocab.mjs --lint: bo qua baseline: tep pipeline/vocab.mjs co o cay dang kiem nhung chua co o merge-base 106cbd3edb83f087b3cde91d6e1c00582b3451a5 — eval moi, chay tren code cu khong phan biet gi
- cd pipeline && node --test scripts/vocab-db.itest.mjs: bo qua baseline: tep pipeline/scripts/vocab-db.itest.mjs co o cay dang kiem nhung chua co o merge-base 106cbd3edb83f087b3cde91d6e1c00582b3451a5 — eval moi, chay tren code cu khong phan biet gi
- node pipeline/vocab.mjs --check-db: bo qua baseline: tep pipeline/vocab.mjs co o cay dang kiem nhung chua co o merge-base 106cbd3edb83f087b3cde91d6e1c00582b3451a5 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — mọi eval nhiều lần chạy đều đồng nhất (mọi eval chạy 1 lần, xác định).

## Iterations

Round 1: E6c failed — bộ test agent có 1 test đỏ (AC-6 để sau, enrich-db.test.ts), xanh trên baseline. Returned to implementation.
