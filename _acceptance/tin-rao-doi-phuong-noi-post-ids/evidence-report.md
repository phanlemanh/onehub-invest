---
schema_version: 2
feature_slug: tin-rao-doi-phuong-noi-post-ids
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: f21b1ba608a156328803be3e5693a95ee932a651
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
  run_id: minted-tin-rao-doi-phuong-noi-post-ids-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.doi_phuong
  verified_at: 2026-10-26T10:58:02Z
  output: |
    node --test scripts/lib/doi-phuong.test.mjs
    DP-AC-1 ma trận mười ca lechTheoBai: ok (mười ca a…j, assert số ca = 10)
    ℹ duration_ms 1026.60575

- eval: E2
  run_id: minted-tin-rao-doi-phuong-noi-post-ids-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.doi_phuong
  verified_at: 2026-10-26T10:58:02Z
  output: |
    node --test scripts/lib/doi-phuong.test.mjs
    DP-AC-2 bài mồi S03 và S05 mất phường qua hai lượt transform → lechTheoBai bắt: ok
    DP-AC-2 thước cũ nối theo offer_id không thấy: ok (chiều đỏ chạy trên cùng hai lần chụp có đối chứng dương)
    ℹ duration_ms 1026.60575

- eval: E3
  run_id: minted-tin-rao-doi-phuong-noi-post-ids-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tin_rao_gan_do
  verified_at: 2026-10-26T10:41:20Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-tin-rao-doi-phuong-noi-post-ids-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-10-26T10:58:02Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-tin-rao-doi-phuong-noi-post-ids-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-10-26T10:58:02Z

- cmd: cd app && npm test
  run_id: minted-tin-rao-doi-phuong-noi-post-ids-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-10-26T10:58:02Z

- cmd: cd pipeline && npm test
  run_id: minted-tin-rao-doi-phuong-noi-post-ids-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-10-26T10:58:02Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-tin-rao-doi-phuong-noi-post-ids-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-10-26T10:58:02Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-tin-rao-doi-phuong-noi-post-ids-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-10-26T10:58:02Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»

Baseline khong do:
- node --test scripts/lib/doi-phuong.test.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»

Eval khong-phan-biet (green tren ca HEAD lan baseline): none — danh sach nay khong do duoc o round nay vi baseline BLOCKED ha tang (moi field baseline la n-a).

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E1, E2, E3 deu dat; 1 finding trong hop dong (AC-2, chieu do cua E2 thieu doi chung duong tren chinh hai lan chup) — sua o f21b1ba6.
Round 2: E1, E2 chay lai tren f21b1ba6, dat; E3 carry-forward tu round 1 (delta khong cham paths cua eval); cac lenh suite xanh.
