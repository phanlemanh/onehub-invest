---
schema_version: 2
feature_slug: noi-du-an-s08-khu-do-thi
verdict: PASS
failed_evals: []
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: b766cd9d2a4e802780c58643bee5d37a3fdcc2b1
human_signoff:
---

# Evidence Report: noi-du-an-s08-khu-do-thi

Round 2. Mọi phép đo máy xanh và rà soát không còn lỗi nào nằm trong hợp đồng. Các lỗi ngoài hợp đồng (chưa qua bác bỏ đối kháng) nằm ở `review-findings.md`, mục «Ngoài hợp đồng — người quyết ở Gate 2».

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
  run_id: minted-noi-du-an-s08-khu-do-thi-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dn1_thuan
  verified_at: 2026-11-05T02:47:28Z
  output: |
    cmd: node --test pipeline/noi-du-an-s08.test.mjs
    ℹ duration_ms 44.792875

- eval: E2
  run_id: minted-noi-du-an-s08-khu-do-thi-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dn1_thuan
  verified_at: 2026-11-05T02:47:28Z
  output: |
    cmd: node --test pipeline/noi-du-an-s08.test.mjs
    ℹ duration_ms 44.792875

- eval: E3
  run_id: minted-noi-du-an-s08-khu-do-thi-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dn1_nap
  verified_at: 2026-11-05T02:47:28Z
  output: |
    cmd: node _acceptance/noi-du-an-s08-khu-do-thi/probes/nap.mjs
    NAP OK

- eval: E4
  run_id: minted-noi-du-an-s08-khu-do-thi-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dn1_nap
  verified_at: 2026-11-05T02:47:28Z
  output: |
    cmd: node _acceptance/noi-du-an-s08-khu-do-thi/probes/nap.mjs
    NAP OK

- eval: E5
  run_id: minted-noi-du-an-s08-khu-do-thi-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dn1_nap
  verified_at: 2026-11-05T02:47:28Z
  output: |
    cmd: node _acceptance/noi-du-an-s08-khu-do-thi/probes/nap.mjs
    NAP OK

- eval: E6
  run_id: minted-noi-du-an-s08-khu-do-thi-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dn1_nap
  verified_at: 2026-11-05T02:47:28Z
  output: |
    cmd: node _acceptance/noi-du-an-s08-khu-do-thi/probes/nap.mjs
    NAP OK

- eval: E7
  run_id: minted-noi-du-an-s08-khu-do-thi-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dn1_kin
  verified_at: 2026-11-05T02:47:28Z
  output: |
    cmd: node _acceptance/noi-du-an-s08-khu-do-thi/probes/kin.mjs
    KIN OK

- eval: E8
  run_id: minted-noi-du-an-s08-khu-do-thi-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dn1_nap
  verified_at: 2026-11-05T02:47:28Z
  output: |
    cmd: node _acceptance/noi-du-an-s08-khu-do-thi/probes/nap.mjs
    NAP OK

- eval: E9
  run_id: minted-noi-du-an-s08-khu-do-thi-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dn1_nap
  verified_at: 2026-11-05T02:47:28Z
  output: |
    cmd: node _acceptance/noi-du-an-s08-khu-do-thi/probes/nap.mjs
    NAP OK

- eval: E10
  run_id: minted-noi-du-an-s08-khu-do-thi-E10-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dn1_nap
  verified_at: 2026-11-05T02:47:28Z
  output: |
    cmd: node _acceptance/noi-du-an-s08-khu-do-thi/probes/nap.mjs
    NAP OK

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-noi-du-an-s08-khu-do-thi-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-11-05T02:47:28Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-noi-du-an-s08-khu-do-thi-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-05T02:47:28Z

- cmd: cd app && npm test
  run_id: minted-noi-du-an-s08-khu-do-thi-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-11-05T02:47:28Z

- cmd: cd pipeline && npm test
  run_id: minted-noi-du-an-s08-khu-do-thi-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-11-05T02:47:28Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-noi-du-an-s08-khu-do-thi-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-05T02:47:28Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-noi-du-an-s08-khu-do-thi-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-11-05T02:47:28Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay (evals.yaml khong doi tu lan baseline cuoi).

Eval không-phân-biệt: none. Mọi block eval ghi baseline n-a vì round này không đo lại; các lệnh suite xanh ở cả hai phía là regression-guard bình thường, không liệt kê.

## Variance

none — every multi-run eval is uniform (mọi eval chạy một lần, tất định).

## Iterations

Round 1: không eval máy nào đỏ; verdict REJECT vì rà soát tìm thấy lỗi trong hợp đồng: hàm kiểm nhận dòng loại không có lý do (AC-9), phép đo chạy-lại-không-đổi và so tập dự án-khu quá yếu (AC-4), tệp trong kho git khác được nhận (AC-2), phép quét tên và mã ở E7 không chứng minh đã chạy tới nhánh lành và lỗi (AC-7), phép đo area_ids bỏ sót nút building (AC-6). Trả về bước hiện thực để sửa.

Round 2: commit b766cd9d sửa các lỗi trong hợp đồng của round 1 (dòng loại phải có lý do, tệp bảng nối phải thuộc đúng kho, phép đo đổi sang so quan hệ). Mọi eval máy và mọi lệnh suite xanh; rà soát không còn finding trong hợp đồng, chín finding mới ngoài hợp đồng chuyển người quyết ở Gate 2.
