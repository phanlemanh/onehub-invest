---
schema_version: 2
feature_slug: ops-access-hardening
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: e721d229010f89fd76e614c943aab677d1a4ef2f
human_signoff: Mạnh 2026-10-23
---

# Evidence Report: ops-access-hardening

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-1 | script | PASS |
| E3 | AC-2 | script | PASS |
| E4 | AC-3 | script | PASS |
| E5 | AC-3 | script | PASS |
| E6 | AC-4 | script | PASS |
| E7 | AC-5 | script | PASS |
| E8 | AC-5 | script | PASS |
| E9 | AC-6 | script | PASS |
| E10 | AC-6 | script | PASS |
| E11 | AC-7 | script | PASS |
| E12 | AC-7 | script | PASS |
| E13 | AC-8 | script | PASS |
| E14 | AC-9 | script | PASS |
| E15 | AC-1 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-ops-access-hardening-E1-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.script.portal_smoke
  verified_at: 2026-10-22T15:24:21Z
  output: |
    portal-smoke: ĐẠT

- eval: E2
  run_id: minted-ops-access-hardening-E2-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.script.portal_static
  verified_at: 2026-10-22T15:24:21Z
  output: |
    portal-compliance: ĐẠT

- eval: E3
  run_id: minted-ops-access-hardening-E3-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.script.portal_smoke
  verified_at: 2026-10-22T15:24:21Z
  output: |
    portal-smoke: ĐẠT

- eval: E4
  run_id: minted-ops-access-hardening-E4-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.script.portal_smoke
  verified_at: 2026-10-22T15:24:21Z
  output: |
    portal-smoke: ĐẠT

- eval: E5
  run_id: minted-ops-access-hardening-E5-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.script.portal_static
  verified_at: 2026-10-22T15:24:21Z
  output: |
    portal-compliance: ĐẠT

- eval: E6
  run_id: minted-ops-access-hardening-E6-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.script.portal_static
  verified_at: 2026-10-22T15:24:21Z
  output: |
    portal-compliance: ĐẠT

- eval: E7
  run_id: minted-ops-access-hardening-E7-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.script.portal_static
  verified_at: 2026-10-22T15:24:21Z
  output: |
    portal-compliance: ĐẠT

- eval: E8
  run_id: minted-ops-access-hardening-E8-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.script.portal_smoke
  verified_at: 2026-10-22T15:24:21Z
  output: |
    portal-smoke: ĐẠT

- eval: E9
  run_id: minted-ops-access-hardening-E9-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.script.portal_smoke
  verified_at: 2026-10-22T15:24:21Z
  output: |
    portal-smoke: ĐẠT

- eval: E10
  run_id: minted-ops-access-hardening-E10-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.script.portal_static
  verified_at: 2026-10-22T15:24:21Z
  output: |
    portal-compliance: ĐẠT

- eval: E11
  run_id: minted-ops-access-hardening-E11-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.script.portal_smoke
  verified_at: 2026-10-22T15:24:21Z
  output: |
    portal-smoke: ĐẠT

- eval: E12
  run_id: minted-ops-access-hardening-E12-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.script.portal_static
  verified_at: 2026-10-22T15:24:21Z
  output: |
    portal-compliance: ĐẠT

- eval: E13
  run_id: minted-ops-access-hardening-E13-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.script.portal_smoke
  verified_at: 2026-10-22T15:24:21Z
  output: |
    portal-smoke: ĐẠT

- eval: E14
  run_id: minted-ops-access-hardening-E14-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.script.portal_smoke
  verified_at: 2026-10-22T15:24:21Z
  output: |
    portal-smoke: ĐẠT

- eval: E15
  run_id: minted-ops-access-hardening-E15-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.app
  verified_at: 2026-10-22T15:24:21Z
  output: |
    tsc --noEmit và lint hoàn tất, 0 lỗi

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh trên cả HEAD lẫn baseline diffBase):
- `BASE_URL=http://localhost:3456 node scripts/smoke-portal-compliance.mjs` phủ E1, E3, E4, E8, E9, E11, E13, E14.
- `node scripts/check-portal-compliance.mjs` phủ E2, E5, E6, E7, E10, E12.

Hai lệnh trên xanh ở cả hai phía; cần viết lại để assert hành vi mới hoặc người xác nhận đây là regression-guard có chủ ý tại Cổng 2.

## Variance

none — mọi eval chạy một lần, deterministic, không có phương sai.

## Iterations

Round 1: mọi eval (E1–E15) đạt, không có eval thất bại. Verdict PASS.
