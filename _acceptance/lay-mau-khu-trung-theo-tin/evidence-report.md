---
schema_version: 2
feature_slug: lay-mau-khu-trung-theo-tin
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 8a23090051eb6b1ff5b2ddc2cbf31bfc14980146
human_signoff: Mạnh 2026-11-07
---

# Evidence Report: lay-mau-khu-trung-theo-tin

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS (carry-forward tu round 1) |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS (carry-forward tu round 1) |
| E5 | AC-4 | test | PASS |
| E6 | AC-5 | test | PASS |
| E7 | AC-6 | script | PASS |
| E8 | AC-7 | test | PASS (carry-forward tu round 1) |
| E9 | AC-7 | test | PASS (carry-forward tu round 1) |
| E10 | AC-8 | script | PASS (carry-forward tu round 1) |

## Evidence

- eval: E1
  run_id: minted-lay-mau-khu-trung-theo-tin-E1-r1
  exit_code: 0
  verifier: config:executors.test.gn2_khoa
  verified_at: 2026-11-07T03:11:29Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E2
  run_id: minted-lay-mau-khu-trung-theo-tin-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.gn2_mau
  verified_at: 2026-11-07T03:30:20Z
  output: |
    MAU OK

- eval: E3
  run_id: minted-lay-mau-khu-trung-theo-tin-E3-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.gn2_su_kien
  verified_at: 2026-11-07T03:30:20Z
  output: |
    ℹ duration_ms 38.384708

- eval: E4
  run_id: minted-lay-mau-khu-trung-theo-tin-E4-r1
  exit_code: 0
  verifier: config:executors.test.gn2_bai_thu
  verified_at: 2026-11-07T03:11:29Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E5
  run_id: minted-lay-mau-khu-trung-theo-tin-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-07T03:30:20Z
  output: |
    ℹ duration_ms 291223.328667

- eval: E6
  run_id: minted-lay-mau-khu-trung-theo-tin-E6-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.gn2_ghep
  verified_at: 2026-11-07T03:30:20Z
  output: |
    ℹ duration_ms 209.148458

- eval: E7
  run_id: minted-lay-mau-khu-trung-theo-tin-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.gn2_lat_that
  verified_at: 2026-11-07T03:30:20Z
  output: |
    LAT-THAT OK

- eval: E8
  run_id: minted-lay-mau-khu-trung-theo-tin-E8-r1
  exit_code: 0
  verifier: config:executors.test.gcn_app
  verified_at: 2026-11-07T03:11:29Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E9
  run_id: minted-lay-mau-khu-trung-theo-tin-E9-r1
  exit_code: 0
  verifier: config:executors.test.ecr_lenh
  verified_at: 2026-11-07T03:11:29Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E10
  run_id: minted-lay-mau-khu-trung-theo-tin-E10-r1
  exit_code: 0
  verifier: config:executors.script.gn2_pham_vi
  verified_at: 2026-11-07T03:11:29Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-lay-mau-khu-trung-theo-tin-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-11-07T03:30:20Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-lay-mau-khu-trung-theo-tin-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-07T03:30:20Z

- cmd: cd app && npm test
  run_id: minted-lay-mau-khu-trung-theo-tin-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-11-07T03:30:20Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-lay-mau-khu-trung-theo-tin-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-07T03:30:20Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-lay-mau-khu-trung-theo-tin-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-11-07T03:30:20Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh trên cả HEAD lẫn baseline, cần viết lại để assert hành vi mới hoặc xác nhận là regression-guard có chủ ý):
- E3: cmd `bash -o pipefail -c 'cd pipeline && node --test --test-name-pattern=GN2-AC-3 lib/eval-labels.test.mjs | tee /dev/stderr | grep "pass 1$" >/dev/null'`
- E6: cmd `bash -o pipefail -c 'cd pipeline && node --test --test-name-pattern=GN2-AC-5 scripts/label-ghep.test.mjs | tee /dev/stderr | grep "pass 1$" >/dev/null'`

Baseline khong do:
- node _acceptance/lay-mau-khu-trung-theo-tin/probes/mau.mjs: bo qua baseline: tep _acceptance/lay-mau-khu-trung-theo-tin/probes/mau.mjs co o cay dang kiem nhung chua co o merge-base 1871d6561d806456dae3acc3e029a242e4447ca6 — eval moi, chay tren code cu khong phan biet gi
- cd pipeline && npm test: baseline vuot tran 180 giay/lenh — da dung ca cay tien trinh; BLOCKED ha tang, khong phai ket qua cua code cu
- node _acceptance/lay-mau-khu-trung-theo-tin/probes/lat-that.mjs: bo qua baseline: tep _acceptance/lay-mau-khu-trung-theo-tin/probes/lat-that.mjs co o cay dang kiem nhung chua co o merge-base 1871d6561d806456dae3acc3e029a242e4447ca6 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: BLOCKED — DB thu trung ten giua E2 va E7, suite pipeline va app do. Tra ve thi cong.
Round 2: E2, E3, E5, E6, E7 va 5 lenh suite chay lai, tat ca xanh (E2 dung DB thu oneinvest_gn2_mau, E7 dung oneinvest_gn2_lat); E1, E4, E8, E9, E10 carry-forward tu round 1. Verdict PASS.

### Re-pin lần 1 — 2026-11-07, do gộp main sau GN1 (#345) làm hoá cũ E8, E9
run_id: repin-20261107T040434Z-94299
sha: 8a23090051eb6b1ff5b2ddc2cbf31bfc14980146 · suites: 6 lệnh exit 0 · evals: 10/10 eval máy đạt kỳ vọng
