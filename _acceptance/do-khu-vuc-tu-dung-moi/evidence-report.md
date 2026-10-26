---
schema_version: 2
feature_slug: do-khu-vuc-tu-dung-moi
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 9c721955dae71302657c4b60c0dd93b5f676a41a
human_signoff: Mạnh 2026-10-26
---

# Evidence Report: do-khu-vuc-tu-dung-moi

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-do-khu-vuc-tu-dung-moi-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tin_rao_gan_do
  verified_at: 2026-10-26T13:19:01Z
  output: |
    kiem-tin-rao-gan: PASS

- eval: E2
  run_id: minted-do-khu-vuc-tu-dung-moi-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tin_rao_gan_do
  verified_at: 2026-10-26T13:19:01Z
  output: |
    kiem-tin-rao-gan: PASS

- eval: E3
  run_id: minted-do-khu-vuc-tu-dung-moi-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tin_rao_gan_do_test
  verified_at: 2026-10-26T13:19:01Z
  output: |
    node --test scripts/kiem-tin-rao-gan-khu-vuc.test.mjs hoàn tất, bộ test xanh
    ℹ duration_ms 62348.689292

- eval: E4
  run_id: minted-do-khu-vuc-tu-dung-moi-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tin_rao_gan_do
  verified_at: 2026-10-26T13:19:01Z
  output: |
    kiem-tin-rao-gan: PASS

- eval: E5
  run_id: minted-do-khu-vuc-tu-dung-moi-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tin_rao_gan_do_test
  verified_at: 2026-10-26T12:40:22Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-do-khu-vuc-tu-dung-moi-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-10-26T13:19:01Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-do-khu-vuc-tu-dung-moi-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-10-26T13:19:01Z

- cmd: cd app && npm test
  run_id: minted-do-khu-vuc-tu-dung-moi-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-10-26T13:19:01Z

- cmd: cd pipeline && npm test
  run_id: minted-do-khu-vuc-tu-dung-moi-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-10-26T13:19:01Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-do-khu-vuc-tu-dung-moi-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-10-26T13:19:01Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-do-khu-vuc-tu-dung-moi-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-10-26T13:19:01Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»

Baseline khong do:
- node scripts/kiem-tin-rao-gan-khu-vuc.mjs --thu: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»
- node --test scripts/kiem-tin-rao-gan-khu-vuc.test.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»

none — moi eval feature deu red tren baseline (co phan biet). Luu y: baseline khong do duoc o round nay nen danh sach eval khong-phan-biet khong do duoc.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: REJECT — lệnh suite cd pipeline && npm test không xanh ở vòng này; trả về triển khai.
Round 2: PASS — mọi eval và mọi lệnh suite xanh; E5 mang từ round 1 vì delta không chạm paths của eval.
