---
schema_version: 2
feature_slug: nhom-hai-lan-s03-xu-goc
verdict: PASS
failed_evals: []
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: e1e6006e236dbcac629fef1cbf17ef396a799be3
human_signoff:
---

# Evidence Report: nhom-hai-lan-s03-xu-goc

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | script | PASS |
| E9 | AC-9 | script | PASS |
| E10 | AC-10 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-nhom-hai-lan-s03-xu-goc-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.nhl_transform
  verified_at: 2026-11-05T11:57:36Z
  output: |
    NHOM HAI LAN TRANSFORM OK

- eval: E2
  run_id: minted-nhom-hai-lan-s03-xu-goc-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.nhl_transform
  verified_at: 2026-11-05T11:57:36Z
  output: |
    NHOM HAI LAN TRANSFORM OK

- eval: E3
  run_id: minted-nhom-hai-lan-s03-xu-goc-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.nhl_transform
  verified_at: 2026-11-05T11:57:36Z
  output: |
    NHOM HAI LAN TRANSFORM OK

- eval: E4
  run_id: minted-nhom-hai-lan-s03-xu-goc-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.nhl_cong
  verified_at: 2026-11-05T11:57:36Z
  output: |
    CONG NHOM HAI LAN OK

- eval: E5
  run_id: minted-nhom-hai-lan-s03-xu-goc-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.nhl_so
  verified_at: 2026-11-05T11:57:36Z
  output: |
    DON NHOM HAI LAN OK

- eval: E6
  run_id: minted-nhom-hai-lan-s03-xu-goc-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.nhl_so
  verified_at: 2026-11-05T11:57:36Z
  output: |
    DON NHOM HAI LAN OK

- eval: E7
  run_id: minted-nhom-hai-lan-s03-xu-goc-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.nhl_cong
  verified_at: 2026-11-05T11:57:36Z
  output: |
    CONG NHOM HAI LAN OK

- eval: E8
  run_id: minted-nhom-hai-lan-s03-xu-goc-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ndk_that
  verified_at: 2026-11-05T11:21:05Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E9
  run_id: minted-nhom-hai-lan-s03-xu-goc-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ndk_that
  verified_at: 2026-11-05T11:21:05Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E10
  run_id: minted-nhom-hai-lan-s03-xu-goc-E10-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.nhl_quet
  verified_at: 2026-11-05T11:57:36Z
  output: |
    QUET NHOM HAI LAN OK

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-nhom-hai-lan-s03-xu-goc-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-11-05T11:57:36Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-nhom-hai-lan-s03-xu-goc-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-05T11:57:36Z

- cmd: cd app && npm test
  run_id: minted-nhom-hai-lan-s03-xu-goc-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-11-05T11:57:36Z

- cmd: cd pipeline && npm test
  run_id: minted-nhom-hai-lan-s03-xu-goc-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-11-05T11:57:36Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-nhom-hai-lan-s03-xu-goc-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-05T11:57:36Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-nhom-hai-lan-s03-xu-goc-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-11-05T11:57:36Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay (evals.yaml khong doi tu lan baseline cuoi); field baseline cua tung block eval ghi n-a.

Eval không phân biệt (xanh trên cả nhánh lẫn baseline, chứng minh khung đo chứ không phải tính năng; cần viết lại để khẳng định hành vi mới hoặc xác nhận là lớp chặn hồi quy có chủ ý):

- E8, E9 (lệnh `node _acceptance/nhom-dang-ky-hai-lan-s03/probes/that-chi-doc.mjs`): baseline green ở round 1, mang sang round này.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: không eval máy nào đỏ, nhưng ba phát hiện trong hợp đồng (hai về AC-3, một về AC-6, chi tiết ở review-findings.md) cho thấy phép đo xanh rỗng hoặc hành vi thật trái lời hứa của AC. Trả về triển khai.
Round 2: commit e1e6006e sửa bài S03 không có khoá không còn gom thành một nhóm và đo đủ dạng khoá; E1-E7 và E10 chạy lại đều xanh, E8 và E9 mang sang từ round 1 vì delta không chạm paths của chúng; sáu lệnh suite xanh; không còn phát hiện trong hợp đồng, ba phát hiện ngoài hợp đồng ghi ở review-findings.md cho người quyết ở Gate 2.
