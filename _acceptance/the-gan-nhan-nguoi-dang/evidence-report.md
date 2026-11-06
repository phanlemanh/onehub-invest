---
schema_version: 2
feature_slug: the-gan-nhan-nguoi-dang
verdict: REJECT
failed_evals: [E5]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: dd33d7d66bd6ac2868f524bd929ae39744965ad2
human_signoff:
---

# Evidence Report: the-gan-nhan-nguoi-dang

Vòng 1. Tám trong chín eval của tính năng xanh; E5 (phép đo gắn mù PL7) đỏ nên kết luận REJECT. Ngoài ra lệnh suite `cd app && npm test` đỏ và không gắn eval nào (xem mục Lệnh suite và Analyst).

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-4 | script | FAIL |
| E6 | AC-1 | test | PASS |
| E7 | AC-1 | test | PASS |
| E8 | AC-5 | script | PASS |
| E9 | AC-6 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-the-gan-nhan-nguoi-dang-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tnd_app
  verified_at: 2026-11-06T01:01:25Z
  output: |
    cd app && node --import tsx --test tests/labels-nguoi-dang.test.tsx
    ℹ duration_ms 1653.034

- eval: E2
  run_id: minted-the-gan-nhan-nguoi-dang-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tnd_app
  verified_at: 2026-11-06T01:01:25Z
  output: |
    cd app && node --import tsx --test tests/labels-nguoi-dang.test.tsx
    ℹ duration_ms 1653.034

- eval: E3
  run_id: minted-the-gan-nhan-nguoi-dang-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tnd_app
  verified_at: 2026-11-06T01:01:25Z
  output: |
    cd app && node --import tsx --test tests/labels-nguoi-dang.test.tsx
    ℹ duration_ms 1653.034

- eval: E4
  run_id: minted-the-gan-nhan-nguoi-dang-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tnd_app
  verified_at: 2026-11-06T01:01:25Z
  output: |
    cd app && node --import tsx --test tests/labels-nguoi-dang.test.tsx
    ℹ duration_ms 1653.034

- eval: E5
  run_id: minted-the-gan-nhan-nguoi-dang-E5-r1
  exit_code: 1
  baseline: red
  verifier: config:executors.script.mgn_mu
  verified_at: 2026-11-06T01:01:25Z
  output: |
    cd app && node --import tsx ../_acceptance/man-gan-nhan-mu/probes/mu.mjs
    error: null value in column "observed_at" of relation "field_assertions" violates not-null constraint
      at _acceptance/man-gan-nhan-mu/probes/mu.mjs:46:3
      code: '23502', table: 'field_assertions', column: 'observed_at'
    Failing row contains (314940950, Property, S03:mgn-mu-1, block_raw, DAUPHATBIEU, dauphatbieu, observed, parser, null, null, {}, ...)
    Cuối đầu ra không có dòng "MU OK" mà eval đòi.

- eval: E6
  run_id: minted-the-gan-nhan-nguoi-dang-E6-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.mgn_app
  verified_at: 2026-11-06T01:01:25Z
  output: |
    cd app && node --import tsx --test tests/labels.test.tsx
    ℹ duration_ms 1919.076333

- eval: E7
  run_id: minted-the-gan-nhan-nguoi-dang-E7-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.gcn_app
  verified_at: 2026-11-06T01:01:25Z
  output: |
    cd app && node --import tsx --test tests/labels-nhom.test.tsx
    ℹ duration_ms 13538.581542

- eval: E8
  run_id: minted-the-gan-nhan-nguoi-dang-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tnd_pham_vi
  verified_at: 2026-11-06T01:01:25Z
  output: |
    bash _acceptance/the-gan-nhan-nguoi-dang/probes/pham-vi.sh
    PHAM-VI OK

- eval: E9
  run_id: minted-the-gan-nhan-nguoi-dang-E9-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.tnd_loi_o
  verified_at: 2026-11-06T01:01:25Z
  output: |
    cd app && node --import tsx --test --test-name-pattern=TND-AC-6 tests/labels-nhom.test.tsx
    ℹ duration_ms 2309.367792

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-the-gan-nhan-nguoi-dang-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-06T01:01:25Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-the-gan-nhan-nguoi-dang-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-06T01:01:25Z

- cmd: cd app && npm test
  run_id: minted-the-gan-nhan-nguoi-dang-SUITE-npm_test__bd9a35-r1
  exit_code: 1
  verified_at: 2026-11-06T01:01:25Z

- cmd: cd pipeline && npm test
  run_id: minted-the-gan-nhan-nguoi-dang-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-11-06T01:01:25Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-the-gan-nhan-nguoi-dang-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-06T01:01:25Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-the-gan-nhan-nguoi-dang-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-06T01:01:25Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh cả trên HEAD lẫn baseline; là regression-guard của màn gắn nhãn và lát theo nhóm, cần xác nhận là chủ ý):
- E6: `cd app && node --import tsx --test tests/labels.test.tsx`
- E7: `cd app && node --import tsx --test tests/labels-nhom.test.tsx`
- E9: `cd app && node --import tsx --test --test-name-pattern=TND-AC-6 tests/labels-nhom.test.tsx` (xanh cả trên baseline nên chưa chứng minh được riêng AC-6; chiều đỏ của ca nằm trong chính test)

Lệnh fail không gắn eval:
- `cd app && npm test` đỏ. Đuôi log cho thấy hai chỗ: (1) một assert `deepStrictEqual` về danh sách tệp, thực tế `['src/components/ops/labels/nguoi-dang.tsx', 'src/components/ops/review-content.tsx']`, kỳ vọng chỉ `['src/components/ops/review-content.tsx']` (tên test bị cắt khỏi đuôi log, gần chỗ `tests/sellers-chip.test.tsx`); (2) `SD-AC-6 chip Căn giá tốt có số tin người bán` dính `deadlock detected` (mã 40P01) trong `napSdtE164` qua DB local dùng chung. Chỉ có đuôi log nên chưa xác định chắc nguyên nhân; (1) có vẻ liên quan tệp mới `nguoi-dang.tsx` do tính năng thêm, (2) trông như tranh chấp khoá DB hơn là lỗi tính năng. Cần chạy lại riêng để xác nhận.

E5 đỏ cả ở baseline lẫn trên HEAD. Trên HEAD, probe `mu.mjs` dừng ở dòng 46 vì INSERT vào `field_assertions` thiếu `observed_at` (cột NOT NULL), trước khi tới phép kiểm gắn mù nào. Vậy kết quả này chưa nói gì về việc gắn mù có còn giữ hay không; nhiều khả năng probe lệch với lược đồ hiện tại. Người/làn sở hữu probe cần xác nhận và sửa probe hoặc chạy lại trên DB đúng lược đồ trước khi tin hay bác AC-4 qua E5.

Baseline không đo:
- cd app && node --import tsx --test tests/labels-nguoi-dang.test.tsx: bo qua baseline: tep app/tests/labels-nguoi-dang.test.tsx co o cay dang kiem nhung chua co o merge-base e0d388a66e9aa4476416d7529681efdea92ada95 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/the-gan-nhan-nguoi-dang/probes/pham-vi.sh: bo qua baseline: tep _acceptance/the-gan-nhan-nguoi-dang/probes/pham-vi.sh co o cay dang kiem nhung chua co o merge-base e0d388a66e9aa4476416d7529681efdea92ada95 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E5 failed — probe mu.mjs lỗi NOT NULL ở cột observed_at của field_assertions trước khi tới phép đo; thêm lệnh suite `cd app && npm test` đỏ không gắn eval. Returned to implementation.
