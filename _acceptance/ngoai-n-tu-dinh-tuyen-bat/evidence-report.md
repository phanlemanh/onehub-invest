---
schema_version: 2
feature_slug: ngoai-n-tu-dinh-tuyen-bat
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 01719cfd46a17d98bc158883b9a88121cffe3d6f
human_signoff:
---

# Evidence Report: ngoai-n-tu-dinh-tuyen-bat

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
| E9 | AC-8 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-ngoai-n-tu-dinh-tuyen-bat-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.nntd_do
  verified_at: 2026-11-16T09:27:29Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E2
  run_id: minted-ngoai-n-tu-dinh-tuyen-bat-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.nntd_do
  verified_at: 2026-11-16T09:27:29Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E3
  run_id: minted-ngoai-n-tu-dinh-tuyen-bat-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.nntd_do
  verified_at: 2026-11-16T09:27:29Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E4
  run_id: minted-ngoai-n-tu-dinh-tuyen-bat-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.nntd_do
  verified_at: 2026-11-16T09:27:29Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E5
  run_id: minted-ngoai-n-tu-dinh-tuyen-bat-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.nntd_do
  verified_at: 2026-11-16T09:27:29Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E6
  run_id: minted-ngoai-n-tu-dinh-tuyen-bat-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.nntd_do
  verified_at: 2026-11-16T09:27:29Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E7
  run_id: minted-ngoai-n-tu-dinh-tuyen-bat-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.nntd_do
  verified_at: 2026-11-16T09:27:29Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E8
  run_id: minted-ngoai-n-tu-dinh-tuyen-bat-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.product_map
  verified_at: 2026-11-16T09:27:29Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E9
  run_id: minted-ngoai-n-tu-dinh-tuyen-bat-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.nntd_luoi
  verified_at: 2026-11-16T09:27:29Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-ngoai-n-tu-dinh-tuyen-bat-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-11-16T15:33:06Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-ngoai-n-tu-dinh-tuyen-bat-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-16T15:33:06Z

- cmd: cd app && npm test
  run_id: minted-ngoai-n-tu-dinh-tuyen-bat-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-11-16T15:33:06Z

- cmd: cd pipeline && npm run test:a
  run_id: minted-ngoai-n-tu-dinh-tuyen-bat-SUITE-test_a-r2
  exit_code: 0
  verified_at: 2026-11-16T15:33:06Z

- cmd: cd pipeline && npm run test:b
  run_id: minted-ngoai-n-tu-dinh-tuyen-bat-SUITE-test_b-r2
  exit_code: 0
  verified_at: 2026-11-16T15:33:06Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-ngoai-n-tu-dinh-tuyen-bat-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-16T15:33:06Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-ngoai-n-tu-dinh-tuyen-bat-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-11-16T15:33:06Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay

Eval khong-phan-biet (pass tren ca code moi lan baseline), can viet lai de assert hanh vi moi hoac xac nhan la regression-guard co chu y:
- E8 (`node scripts/product-map.mjs --root . --check`)
- E9 (lenh nntd_luoi: lưới trước-merge không còn VIOLATION ngoài dòng chờ của chính hồ sơ)

## Variance

none — every multi-run eval is uniform

## Judge

Khong co judgment item nao trong hop dong nay; khong co panel de xuat va khong co human_override can dien.

## Iterations

Round 1: eval may xanh; lenh suite lint do o lan chay dau, tra ve implementation de sua.
Round 2: E1–E9 carry-forward tu round 1 (delta khong cham paths cua eval); bay lenh suite chay lai va xanh het. Verdict PASS.
