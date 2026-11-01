---
schema_version: 2
feature_slug: app-test-chiu-song-song
verdict: REJECT
failed_evals: ["E1"]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: d05545a7c7c0ffe5ac842fe892ae3cfa8a8e4ffa
human_signoff:
---

# Evidence Report: app-test-chiu-song-song

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | REJECT (đỏ) |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |

Lệnh đỏ không gắn eval nào: `cd agent && npm test` (một ca đỏ: KD-AC-7 tệp test đã ký không đổi so với merge-base, ở agent/tests/judge-entity-khong-dau.test.ts). Ghi nhận để người xem; không thuộc phạm vi E1-E5.

## Evidence

- eval: E1
  run_id: minted-app-test-chiu-song-song-E1-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.atss_chan
  verified_at: 2026-11-01T09:07:08Z
  output: |
    # DB thử: oneinvest_p4_atss_70498
    # HEAD dưới A: ba tệp thoát sạch (2.0 s, 2.1 s, 0.5 s)
    # HEAD dưới B (DDL 3 s) app/tests/deals-phi-ly.test.tsx: thoát sạch, 3.6 s
    AssertionError: app/tests/deals-phi-ly.test.tsx dưới B 3.636 s so nền 1.993 s — không thấy đã chờ DDL
    (chênh 1.64 s, probe đòi ít nhất 2 s; đường dẫn song-song.mjs dòng 121)

- eval: E2
  run_id: minted-app-test-chiu-song-song-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.atss_khoa
  verified_at: 2026-11-01T09:07:08Z
  output: |
    KHOA OK

- eval: E3
  run_id: minted-app-test-chiu-song-song-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.atss_assert
  verified_at: 2026-11-01T09:07:08Z
  output: |
    ASSERT OK

- eval: E4
  run_id: minted-app-test-chiu-song-song-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.atss_lib
  verified_at: 2026-11-01T09:07:08Z
  output: |
    LIB OK

- eval: E5
  run_id: minted-app-test-chiu-song-song-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.atss_pham_vi
  verified_at: 2026-11-01T09:07:08Z
  output: |
    PHAM VI OK

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-app-test-chiu-song-song-SUITE-npm_test__bb6271-r1
  exit_code: 1
  verified_at: 2026-11-01T09:07:08Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-app-test-chiu-song-song-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-01T09:07:08Z

- cmd: cd app && npm test
  run_id: minted-app-test-chiu-song-song-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-11-01T09:07:08Z

- cmd: cd pipeline && npm test
  run_id: minted-app-test-chiu-song-song-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-11-01T09:07:08Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-app-test-chiu-song-song-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-01T09:07:08Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-app-test-chiu-song-song-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-01T09:07:08Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — moi eval feature deu red tren baseline (co phan biet)

Baseline khong do:
- node _acceptance/app-test-chiu-song-song/probes/song-song.mjs chan: bo qua baseline: tep _acceptance/app-test-chiu-song-song/probes/song-song.mjs co o cay dang kiem nhung chua co o merge-base d96640c67c8889d4e9203860b8cd1ebd5d6c30ad — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/app-test-chiu-song-song/probes/song-song.mjs khoa: bo qua baseline: tep _acceptance/app-test-chiu-song-song/probes/song-song.mjs co o cay dang kiem nhung chua co o merge-base d96640c67c8889d4e9203860b8cd1ebd5d6c30ad — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/app-test-chiu-song-song/probes/song-song.mjs assert: bo qua baseline: tep _acceptance/app-test-chiu-song-song/probes/song-song.mjs co o cay dang kiem nhung chua co o merge-base d96640c67c8889d4e9203860b8cd1ebd5d6c30ad — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/app-test-chiu-song-song/probes/song-song.mjs lib: bo qua baseline: tep _acceptance/app-test-chiu-song-song/probes/song-song.mjs co o cay dang kiem nhung chua co o merge-base d96640c67c8889d4e9203860b8cd1ebd5d6c30ad — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/app-test-chiu-song-song/probes/pham-vi.sh: bo qua baseline: tep _acceptance/app-test-chiu-song-song/probes/pham-vi.sh co o cay dang kiem nhung chua co o merge-base d96640c67c8889d4e9203860b8cd1ebd5d6c30ad — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E1 failed — lượt app/tests/deals-phi-ly.test.tsx dưới phiên B (DDL 3 s) chỉ chậm hơn đường nền 1.64 s, dưới mức 2 s probe đòi, nên chưa chứng được tệp đã chờ DDL. Returned to implementation.
