---
schema_version: 2
feature_slug: the-gan-nhan-nguoi-dang
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 4dc14046116e7ce8015b047d29e4d81a44ca547b
human_signoff: Mạnh 2026-11-06
---

# Evidence Report: the-gan-nhan-nguoi-dang

Vòng 2. Cả chín eval của tính năng xanh. Sáu eval (E1, E5, E6, E7, E8, E9) chạy lại trên commit 4dc14046; ba eval E2, E3, E4 mang sang từ vòng 1 vì thay đổi của vòng này không chạm paths của chúng. Sáu lệnh suite hồi quy đều xanh.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-4 | script | PASS |
| E6 | AC-1 | test | PASS |
| E7 | AC-1 | test | PASS |
| E8 | AC-5 | script | PASS |
| E9 | AC-6 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-the-gan-nhan-nguoi-dang-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tnd_app
  verified_at: 2026-11-06T02:31:09Z
  output: |
    cd app && node --import tsx --test tests/labels-nguoi-dang.test.tsx
    ℹ duration_ms 2240.89175

- eval: E2
  run_id: minted-the-gan-nhan-nguoi-dang-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tnd_app
  verified_at: 2026-11-06T01:01:25Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E3
  run_id: minted-the-gan-nhan-nguoi-dang-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tnd_app
  verified_at: 2026-11-06T01:01:25Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E4
  run_id: minted-the-gan-nhan-nguoi-dang-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tnd_app
  verified_at: 2026-11-06T01:01:25Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E5
  run_id: minted-the-gan-nhan-nguoi-dang-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.mgn_mu
  verified_at: 2026-11-06T02:31:09Z
  output: |
    cd app && node --import tsx ../_acceptance/man-gan-nhan-mu/probes/mu.mjs
    MU OK

- eval: E6
  run_id: minted-the-gan-nhan-nguoi-dang-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.mgn_app
  verified_at: 2026-11-06T02:31:09Z
  output: |
    cd app && node --import tsx --test tests/labels.test.tsx
    ℹ duration_ms 1361.597667

- eval: E7
  run_id: minted-the-gan-nhan-nguoi-dang-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.gcn_app
  verified_at: 2026-11-06T02:31:09Z
  output: |
    cd app && node --import tsx --test tests/labels-nhom.test.tsx
    ℹ duration_ms 13888.034417

- eval: E8
  run_id: minted-the-gan-nhan-nguoi-dang-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tnd_pham_vi
  verified_at: 2026-11-06T02:31:09Z
  output: |
    bash _acceptance/the-gan-nhan-nguoi-dang/probes/pham-vi.sh
    PHAM-VI OK

- eval: E9
  run_id: minted-the-gan-nhan-nguoi-dang-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tnd_loi_o
  verified_at: 2026-11-06T02:31:09Z
  output: |
    cd app && node --import tsx --test --test-name-pattern=TND-AC-6 tests/labels-nhom.test.tsx
    ℹ duration_ms 2836.895208

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-the-gan-nhan-nguoi-dang-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-11-06T02:31:09Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-the-gan-nhan-nguoi-dang-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-06T02:31:09Z

- cmd: cd app && npm test
  run_id: minted-the-gan-nhan-nguoi-dang-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-11-06T02:31:09Z

- cmd: cd pipeline && npm test
  run_id: minted-the-gan-nhan-nguoi-dang-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-11-06T02:31:09Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-the-gan-nhan-nguoi-dang-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-06T02:31:09Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-the-gan-nhan-nguoi-dang-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-11-06T02:31:09Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay (evals.yaml khong doi tu lan baseline cuoi). Field baseline cua moi eval ghi n-a.

Eval không phân biệt (xanh cả trên HEAD lẫn baseline ở vòng 1; là regression-guard của màn gắn nhãn và lát theo nhóm, cần xác nhận là chủ ý):
- E6: `cd app && node --import tsx --test tests/labels.test.tsx`
- E7: `cd app && node --import tsx --test tests/labels-nhom.test.tsx`
- E9: `cd app && node --import tsx --test --test-name-pattern=TND-AC-6 tests/labels-nhom.test.tsx`

Lệnh suite xanh cả hai phía là regression-guard thông thường, không liệt kê.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E5 failed — probe mu.mjs dừng ở lỗi NOT NULL của cột observed_at trong field_assertions trước khi tới phép đo; thêm lệnh suite `cd app && npm test` đỏ không gắn eval. Returned to implementation.
Round 2: tất cả eval xanh sau khi sửa đầu dò E5 theo lược đồ, kê nguoi-dang.tsx vào quét nhãn Ops và đổi đơn vị AC-6; sáu lệnh suite xanh. Verdict PASS.
