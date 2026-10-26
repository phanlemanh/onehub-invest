---
schema_version: 2
feature_slug: tin-rao-doi-phuong-noi-post-ids
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 1ddb7345b586660f07ced706e1ff0d98385fbc35
human_signoff:
---

# Evidence Report: tin-rao-doi-phuong-noi-post-ids

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-tin-rao-doi-phuong-noi-post-ids-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.doi_phuong
  verified_at: 2026-10-26T10:41:20Z
  cmd: node --test scripts/lib/doi-phuong.test.mjs
  output: |
    ca 'DP-AC-1 ma trận mười ca lechTheoBai' ok (mười ca a…j, assert số ca = 10)
    ℹ duration_ms 2146.643792

- eval: E2
  run_id: minted-tin-rao-doi-phuong-noi-post-ids-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.doi_phuong
  verified_at: 2026-10-26T10:41:20Z
  cmd: node --test scripts/lib/doi-phuong.test.mjs
  output: |
    ca 'DP-AC-2 bài mồi S03 và S05 mất phường qua hai lượt transform → lechTheoBai bắt' ok
    chiều đỏ 'DP-AC-2 thước cũ nối theo offer_id không thấy' ok
    ℹ duration_ms 2146.643792

- eval: E3
  run_id: minted-tin-rao-doi-phuong-noi-post-ids-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tin_rao_gan_do
  verified_at: 2026-10-26T10:41:20Z
  cmd: node scripts/kiem-tin-rao-gan-khu-vuc.mjs --thu
  output: |
    kiem-tin-rao-gan: PASS

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-tin-rao-doi-phuong-noi-post-ids-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-26T10:41:20Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-tin-rao-doi-phuong-noi-post-ids-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-26T10:41:20Z

- cmd: cd app && npm test
  run_id: minted-tin-rao-doi-phuong-noi-post-ids-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-10-26T10:41:20Z

- cmd: cd pipeline && npm test
  run_id: minted-tin-rao-doi-phuong-noi-post-ids-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-10-26T10:41:20Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-tin-rao-doi-phuong-noi-post-ids-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-26T10:41:20Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-tin-rao-doi-phuong-noi-post-ids-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-26T10:41:20Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»

Baseline khong do:
- node --test scripts/lib/doi-phuong.test.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»
- node scripts/kiem-tin-rao-gan-khu-vuc.mjs --thu: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»

Eval không-phân-biệt: không có eval nào bị xác định là không-phân-biệt; lưu ý baseline không đo được ở round này nên danh sách này chưa phản ánh việc eval có đỏ trên code cũ hay không.

## Variance

none — mọi eval đều xác định (runs: 1), không có eval ngẫu nhiên và không có eval chập chờn.

## Iterations

Round 1: E1, E2, E3 đều đạt; không có eval thất bại, không có mục judgment chờ người. Verdict PASS.
