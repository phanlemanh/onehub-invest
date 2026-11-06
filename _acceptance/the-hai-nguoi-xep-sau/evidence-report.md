---
schema_version: 2
feature_slug: the-hai-nguoi-xep-sau
verdict: PASS
failed_evals: []
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 8f62dec5a5cef6427d231fc2689affbb4ddddf37
human_signoff: Mạnh 2026-11-06
---

# Evidence Report: the-hai-nguoi-xep-sau

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-2 | test | PASS |
| E4 | AC-2 | script | PASS |
| E5 | AC-3 | script | PASS |
| E6 | AC-4 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-the-hai-nguoi-xep-sau-E1-r1
  exit_code: 0
  carried_from_round: 1
  verifier: config:executors.test.thn_app
  verified_at: 2026-11-06T05:19:07Z
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E2
  run_id: minted-the-hai-nguoi-xep-sau-E2-r1
  exit_code: 0
  carried_from_round: 1
  verifier: config:executors.test.mgn_app
  verified_at: 2026-11-06T05:19:07Z
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E3
  run_id: minted-the-hai-nguoi-xep-sau-E3-r1
  exit_code: 0
  carried_from_round: 1
  verifier: config:executors.test.gcn_app
  verified_at: 2026-11-06T05:19:07Z
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E4
  run_id: minted-the-hai-nguoi-xep-sau-E4-r1
  exit_code: 0
  carried_from_round: 1
  verifier: config:executors.script.tnd_mu
  verified_at: 2026-11-06T05:19:07Z
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E5
  run_id: minted-the-hai-nguoi-xep-sau-E5-r1
  exit_code: 0
  carried_from_round: 1
  verifier: config:executors.script.thn_pham_vi
  verified_at: 2026-11-06T05:19:07Z
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E6
  run_id: minted-the-hai-nguoi-xep-sau-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.thn_lat_that
  verified_at: 2026-11-06T05:50:05Z
  output: |
    LAT-THAT OK

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-the-hai-nguoi-xep-sau-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-11-06T05:50:05Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-the-hai-nguoi-xep-sau-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-06T05:50:05Z

- cmd: cd app && npm test
  run_id: minted-the-hai-nguoi-xep-sau-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-11-06T05:50:05Z

- cmd: cd pipeline && npm test
  run_id: minted-the-hai-nguoi-xep-sau-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-11-06T05:50:05Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-the-hai-nguoi-xep-sau-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-06T05:50:05Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-the-hai-nguoi-xep-sau-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-11-06T05:50:05Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — moi eval feature deu red tren baseline (co phan biet)

Baseline khong do:
- cd app && node --import tsx ../_acceptance/the-hai-nguoi-xep-sau/probes/lat-that.mjs: bo qua baseline: tep _acceptance/the-hai-nguoi-xep-sau/probes/lat-that.mjs co o cay dang kiem nhung chua co o merge-base 29a9d9885ab66758ac0d68c2cb8b458ae8a057d5 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E1–E6 và sáu lệnh suite đều đạt; một finding trong hợp đồng ở AC-4 (đầu dò lat-that.mjs đếm số tin đơn với tới mà không lấy từ tinKe). Trả về thi công, sửa ở commit 8f62dec5 (AC-4 chỉ đo đầu ra tinKe thật).
Round 2: E6 chạy lại và đạt cùng sáu lệnh suite; E1–E5 carry-forward từ round 1 vì delta không chạm paths của các eval này. Verdict PASS.
