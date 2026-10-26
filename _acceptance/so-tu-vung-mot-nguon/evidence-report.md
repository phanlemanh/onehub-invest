---
schema_version: 2
feature_slug: so-tu-vung-mot-nguon
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 6eeb639a9420fa0873b78d223ac7d55af60790ae
human_signoff: Mạnh 2026-10-26
---

# Evidence Report: so-tu-vung-mot-nguon

Round 2. Cả 16 eval xanh: 7 eval chạy lại trên cây mới (E4, E5, E5b, E6b, E6c, E7, E8), 9 eval mang sang từ round 1 vì delta không chạm paths của chúng (E1, E2, E3, E3b, E6, E6d, E6e, E8b, E9). Bốn lệnh suite hồi quy chạy lại và xanh.

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
| E6c | AC-6 | test | PASS |
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
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E2
  run_id: minted-so-tu-vung-mot-nguon-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.vocab
  verified_at: 2026-10-26T02:21:18Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E3
  run_id: minted-so-tu-vung-mot-nguon-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.vocab
  verified_at: 2026-10-26T02:21:18Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E3b
  run_id: minted-so-tu-vung-mot-nguon-E3b-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.vocab_check
  verified_at: 2026-10-26T02:21:18Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E4
  run_id: minted-so-tu-vung-mot-nguon-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.vocab
  verified_at: 2026-10-26T02:29:07Z
  output: |
    cd pipeline && node --test scripts/vocab.test.mjs scripts/vocab-lint.test.mjs
    ℹ duration_ms 1061.66875

- eval: E5
  run_id: minted-so-tu-vung-mot-nguon-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.vocab_lint
  verified_at: 2026-10-26T02:29:07Z
  output: |
    node pipeline/vocab.mjs --lint
    vocab --lint: 0 chỗ viết tay ngoài sổ · ngoại lệ 8

- eval: E5b
  run_id: minted-so-tu-vung-mot-nguon-E5b-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.vocab
  verified_at: 2026-10-26T02:29:07Z
  output: |
    cd pipeline && node --test scripts/vocab.test.mjs scripts/vocab-lint.test.mjs
    ℹ duration_ms 1061.66875

- eval: E6
  run_id: minted-so-tu-vung-mot-nguon-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-26T02:21:18Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E6b
  run_id: minted-so-tu-vung-mot-nguon-E6b-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-26T02:29:07Z
  output: |
    cd pipeline && npm test
    ℹ duration_ms 9316.013125

- eval: E6c
  run_id: minted-so-tu-vung-mot-nguon-E6c-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.agent
  verified_at: 2026-10-26T02:29:07Z
  output: |
    cd agent && npm test
    ℹ duration_ms 1309.305583

- eval: E6d
  run_id: minted-so-tu-vung-mot-nguon-E6d-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app
  verified_at: 2026-10-26T02:21:18Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E6e
  run_id: minted-so-tu-vung-mot-nguon-E6e-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ui_lint_rules
  verified_at: 2026-10-26T02:21:18Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E7
  run_id: minted-so-tu-vung-mot-nguon-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.vocab_db
  verified_at: 2026-10-26T02:29:07Z
  output: |
    cd pipeline && node --test scripts/vocab-db.itest.mjs
    ℹ duration_ms 908.704

- eval: E8
  run_id: minted-so-tu-vung-mot-nguon-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.vocab_db
  verified_at: 2026-10-26T02:29:07Z
  output: |
    cd pipeline && node --test scripts/vocab-db.itest.mjs
    ℹ duration_ms 908.704

- eval: E8b
  run_id: minted-so-tu-vung-mot-nguon-E8b-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.vocab_db
  verified_at: 2026-10-26T02:21:18Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E9
  run_id: minted-so-tu-vung-mot-nguon-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.vocab
  verified_at: 2026-10-26T02:21:18Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval

### Lệnh suite (hồi quy)

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-so-tu-vung-mot-nguon-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-10-26T02:29:07Z

- cmd: cd app && npm test
  run_id: minted-so-tu-vung-mot-nguon-SUITE-npm_test-r2
  exit_code: 0
  verified_at: 2026-10-26T02:29:07Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-so-tu-vung-mot-nguon-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-10-26T02:29:07Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-so-tu-vung-mot-nguon-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-10-26T02:29:07Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay (evals.yaml khong doi tu lan baseline cuoi). Field baseline cua moi block eval ghi n-a vi round nay khong do.

Eval không-phân-biệt (xanh trên cả HEAD lẫn baseline, đo ở round 1; là regression-guard có chủ ý hoặc cần viết lại để assert hành vi mới):
- E6 (`cd app && npm test`)
- E6b (`cd pipeline && npm test`)
- E6e (`cd app && npm run test:lint-rules`)

Không eval nào khai judgment, nên không có hội đồng judge nào được chấm cho báo cáo này: không có khai input, máy không có căn cứ chấm judge, không có mục nào chờ human_override.

## Variance

none — mọi eval nhiều lần chạy đều đồng nhất (mọi eval chạy 1 lần, xác định).

## Iterations

Round 1: E6c failed — bộ test agent có 1 test đỏ (AC-6 để sau, enrich-db.test.ts), xanh trên baseline. Returned to implementation.
Round 2: cả 16 eval xanh. Bảy eval chạy lại trên cây mới, chín eval mang sang từ round 1 (delta không chạm paths của chúng); E6c xanh sau khi cô lập ca enrich-db AC-6. Verdict PASS.

### Re-pin lần 1 — 2026-10-26, do ghim lại sau gộp main 7063d29 (xung đột tệp máy sinh + enrich-db của #118)
run_id: repin-20261026T031937Z-22916
sha: 87d8d4e9aa2faf0f36b8d49a77b895567a59979b · suites: 6 lệnh exit 0 · evals: 16/16 eval máy đạt kỳ vọng

### Re-pin lần 2 — 2026-10-26, do ghim lại sau gộp main (#119 UI6)
run_id: repin-20261026T040017Z-88605
sha: 2913ac5b8337ed018c6cfd58939b54d0b694761f · suites: 6 lệnh exit 0 · evals: 16/16 eval máy đạt kỳ vọng

### Re-pin lần 3 — 2026-10-26, do ghim lại sau gộp main aa928f3 (#113 C7)
run_id: repin-20261026T040951Z-52516
sha: 6eeb639a9420fa0873b78d223ac7d55af60790ae · suites: 6 lệnh exit 0 · evals: 16/16 eval máy đạt kỳ vọng
