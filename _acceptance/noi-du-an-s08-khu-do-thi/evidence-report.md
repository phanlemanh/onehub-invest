---
schema_version: 2
feature_slug: noi-du-an-s08-khu-do-thi
verdict: REJECT
failed_evals: []
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: c10f54d8f2783c861cb1d3c25c430559a0698478
human_signoff:
---

# Evidence Report: noi-du-an-s08-khu-do-thi

Round 1. Các phép đo máy đều chạy xong và xanh; verdict tổng là REJECT vì rà soát tìm thấy lỗi trong hợp đồng (AC-2, AC-4, AC-6, AC-7, AC-9), xem `review-findings.md` mục «Trong hợp đồng» và section Iterations.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | script | PASS |
| E9 | AC-2 | script | PASS |
| E10 | AC-9 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-noi-du-an-s08-khu-do-thi-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dn1_thuan
  verified_at: 2026-11-05T02:26:31Z
  output: |
    cmd: node --test pipeline/noi-du-an-s08.test.mjs
    ℹ duration_ms 56.402916

- eval: E2
  run_id: minted-noi-du-an-s08-khu-do-thi-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dn1_thuan
  verified_at: 2026-11-05T02:26:31Z
  output: |
    cmd: node --test pipeline/noi-du-an-s08.test.mjs
    ℹ duration_ms 56.402916

- eval: E3
  run_id: minted-noi-du-an-s08-khu-do-thi-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dn1_nap
  verified_at: 2026-11-05T02:26:31Z
  output: |
    cmd: node _acceptance/noi-du-an-s08-khu-do-thi/probes/nap.mjs
    NAP OK

- eval: E4
  run_id: minted-noi-du-an-s08-khu-do-thi-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dn1_nap
  verified_at: 2026-11-05T02:26:31Z
  output: |
    cmd: node _acceptance/noi-du-an-s08-khu-do-thi/probes/nap.mjs
    NAP OK

- eval: E5
  run_id: minted-noi-du-an-s08-khu-do-thi-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dn1_nap
  verified_at: 2026-11-05T02:26:31Z
  output: |
    cmd: node _acceptance/noi-du-an-s08-khu-do-thi/probes/nap.mjs
    NAP OK

- eval: E6
  run_id: minted-noi-du-an-s08-khu-do-thi-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dn1_nap
  verified_at: 2026-11-05T02:26:31Z
  output: |
    cmd: node _acceptance/noi-du-an-s08-khu-do-thi/probes/nap.mjs
    NAP OK

- eval: E7
  run_id: minted-noi-du-an-s08-khu-do-thi-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dn1_kin
  verified_at: 2026-11-05T02:26:31Z
  output: |
    cmd: node _acceptance/noi-du-an-s08-khu-do-thi/probes/kin.mjs
    KIN OK

- eval: E8
  run_id: minted-noi-du-an-s08-khu-do-thi-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dn1_nap
  verified_at: 2026-11-05T02:26:31Z
  output: |
    cmd: node _acceptance/noi-du-an-s08-khu-do-thi/probes/nap.mjs
    NAP OK

- eval: E9
  run_id: minted-noi-du-an-s08-khu-do-thi-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dn1_nap
  verified_at: 2026-11-05T02:26:31Z
  output: |
    cmd: node _acceptance/noi-du-an-s08-khu-do-thi/probes/nap.mjs
    NAP OK

- eval: E10
  run_id: minted-noi-du-an-s08-khu-do-thi-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dn1_nap
  verified_at: 2026-11-05T02:26:31Z
  output: |
    cmd: node _acceptance/noi-du-an-s08-khu-do-thi/probes/nap.mjs
    NAP OK

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-noi-du-an-s08-khu-do-thi-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-05T02:26:31Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-noi-du-an-s08-khu-do-thi-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-05T02:26:31Z

- cmd: cd app && npm test
  run_id: minted-noi-du-an-s08-khu-do-thi-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-11-05T02:26:31Z

- cmd: cd pipeline && npm test
  run_id: minted-noi-du-an-s08-khu-do-thi-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-11-05T02:26:31Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-noi-du-an-s08-khu-do-thi-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-05T02:26:31Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-noi-du-an-s08-khu-do-thi-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-05T02:26:31Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — không eval nào xanh ở cả hai phía (green-on-both). Cả ba lệnh eval có baseline n-a (không đo được trên cây cũ), nên chưa có bằng chứng red cho eval nào; đây là giới hạn của phép đo baseline, không phải bằng chứng harness.

Baseline khong do:
- node --test pipeline/noi-du-an-s08.test.mjs: bo qua baseline: tep pipeline/noi-du-an-s08.test.mjs co o cay dang kiem nhung chua co o merge-base d0b08f4d6cd030a43c8f2a52c6009a8d511b7b75 — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/noi-du-an-s08-khu-do-thi/probes/nap.mjs: bo qua baseline: tep _acceptance/noi-du-an-s08-khu-do-thi/probes/nap.mjs co o cay dang kiem nhung chua co o merge-base d0b08f4d6cd030a43c8f2a52c6009a8d511b7b75 — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/noi-du-an-s08-khu-do-thi/probes/kin.mjs: bo qua baseline: tep _acceptance/noi-du-an-s08-khu-do-thi/probes/kin.mjs co o cay dang kiem nhung chua co o merge-base d0b08f4d6cd030a43c8f2a52c6009a8d511b7b75 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform (mọi eval chạy một lần, tất định).

## Iterations

Round 1: không eval máy nào đỏ; REJECT vì rà soát tìm thấy lỗi trong hợp đồng: hàm kiểm nhận dòng loại không có lý do (AC-9), phép đo chạy-lại-không-đổi và so tập dự án-khu quá yếu (AC-4), tệp trong kho git khác được nhận (AC-2), phép quét tên và mã ở E7 không chứng minh đã chạy tới nhánh lành và lỗi (AC-7), phép đo area_ids bỏ sót nút building (AC-6). Trả về bước hiện thực để sửa.
