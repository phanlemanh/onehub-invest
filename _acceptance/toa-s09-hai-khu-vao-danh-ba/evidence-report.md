---
schema_version: 2
feature_slug: toa-s09-hai-khu-vao-danh-ba
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: c1857f44c3f66038bba51bdd2929333e4dad2958
human_signoff: Mạnh 2026-11-14
---

# Evidence Report: toa-s09-hai-khu-vao-danh-ba

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | script | PASS |
| E9 | AC-9 | script | PASS |
| E10 | AC-10 | script | PASS |

## Evidence

- eval: E9
  run_id: minted-toa-s09-hai-khu-vao-danh-ba-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s09_ranh_gioi
  verified_at: 2026-11-14T01:30:47Z
  output: |
    tep=27 ngoai_vung=0 collector_doi=0 snapshots_doi=0 sync_cloud_doi=0 app_doi=0 ten_nguon=0 097_ap_hai_lan=ok

- eval: E1
  run_id: minted-toa-s09-hai-khu-vao-danh-ba-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s09_db
  verified_at: 2026-11-14T00:50:58Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E2
  run_id: minted-toa-s09-hai-khu-vao-danh-ba-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.s09_ham
  verified_at: 2026-11-14T00:50:58Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E3
  run_id: minted-toa-s09-hai-khu-vao-danh-ba-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s09_db
  verified_at: 2026-11-14T00:50:58Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E4
  run_id: minted-toa-s09-hai-khu-vao-danh-ba-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s09_db
  verified_at: 2026-11-14T00:50:58Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E5
  run_id: minted-toa-s09-hai-khu-vao-danh-ba-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s09_db
  verified_at: 2026-11-14T00:50:58Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E6
  run_id: minted-toa-s09-hai-khu-vao-danh-ba-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s09_that
  verified_at: 2026-11-14T00:50:58Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E7
  run_id: minted-toa-s09-hai-khu-vao-danh-ba-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s09_that
  verified_at: 2026-11-14T00:50:58Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E8
  run_id: minted-toa-s09-hai-khu-vao-danh-ba-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s09_db
  verified_at: 2026-11-14T00:50:58Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E10
  run_id: minted-toa-s09-hai-khu-vao-danh-ba-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s09_db
  verified_at: 2026-11-14T00:50:58Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-toa-s09-hai-khu-vao-danh-ba-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-11-14T01:30:47Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-toa-s09-hai-khu-vao-danh-ba-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-14T01:30:47Z

- cmd: cd app && npm test
  run_id: minted-toa-s09-hai-khu-vao-danh-ba-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-11-14T01:30:47Z

- cmd: cd pipeline && npm run test:a
  run_id: minted-toa-s09-hai-khu-vao-danh-ba-SUITE-test_a-r2
  exit_code: 0
  verified_at: 2026-11-14T01:30:47Z

- cmd: cd pipeline && npm run test:b
  run_id: minted-toa-s09-hai-khu-vao-danh-ba-SUITE-test_b-r2
  exit_code: 0
  verified_at: 2026-11-14T01:30:47Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-toa-s09-hai-khu-vao-danh-ba-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-14T01:30:47Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-toa-s09-hai-khu-vao-danh-ba-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-11-14T01:30:47Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay

none — khong eval nao duoc liet ke la khong-phan-biet; lenh suite xanh la regression-guard binh thuong.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: lượt chấm 1 — sửa AC-8b (so bước S08 với bản trước hàng) và E9 (bỏ định danh lược đồ, thêm đối chứng dương). Returned to implementation.
Round 2: E9 chạy lại, các eval khác carry-forward từ round 1; toàn bộ eval và lệnh suite xanh, verdict PASS.

### Re-pin lần 1 — 2026-11-14, do sửa DBS-AC-6 sau chữ ký, CI chân scripts đỏ; nhận main 78f100c9
run_id: repin-20261114T025727Z-99777
sha: c1857f44c3f66038bba51bdd2929333e4dad2958 · suites: 7 lệnh exit 0 · evals: 10/10 eval máy đạt kỳ vọng
