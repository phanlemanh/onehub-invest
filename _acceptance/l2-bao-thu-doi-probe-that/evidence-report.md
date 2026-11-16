---
schema_version: 2
feature_slug: l2-bao-thu-doi-probe-that
verdict: REJECT
failed_evals: ["E9","E10"]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 3f203400e60c36e3a706c6783151f1bf8346a059
human_signoff:
---

# Evidence Report: l2-bao-thu-doi-probe-that

Round 1. Hai eval E9 và E10 đỏ: cả hai chạy chung một lệnh `probe-du-lieu-that.test.ts`, lệnh này thoát khác 0 vì ca PT-AC-8 đỏ. Ca PT-AC-9 (tsconfig kiểm agent/probes) xanh trong cùng lệnh.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-4 | test | PASS |
| E6 | AC-5 | test | PASS |
| E7 | AC-6 | test | PASS |
| E8 | AC-7 | test | PASS |
| E9 | AC-8 | test | FAIL |
| E10 | AC-9 | test | FAIL |
| E11 | AC-10 | test | PASS |
| E12 | AC-10 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-l2-bao-thu-doi-probe-that-E1-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.judge_entity_duong
  verified_at: 2026-11-15T23:05:25Z
  output: |
    cd agent && node --import tsx --test tests/judge-entity-duong.test.ts probes/o-duong-that.test.ts
    ℹ duration_ms 2204.726542

- eval: E2
  run_id: minted-l2-bao-thu-doi-probe-that-E2-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.judge_entity_duong
  verified_at: 2026-11-15T23:05:25Z
  output: |
    cd agent && node --import tsx --test tests/judge-entity-duong.test.ts probes/o-duong-that.test.ts
    ℹ duration_ms 2204.726542

- eval: E3
  run_id: minted-l2-bao-thu-doi-probe-that-E3-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.judge_entity_duong
  verified_at: 2026-11-15T23:05:25Z
  output: |
    cd agent && node --import tsx --test tests/judge-entity-duong.test.ts probes/o-duong-that.test.ts
    ℹ duration_ms 2204.726542

- eval: E8
  run_id: minted-l2-bao-thu-doi-probe-that-E8-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.judge_entity_duong
  verified_at: 2026-11-15T23:05:25Z
  output: |
    cd agent && node --import tsx --test tests/judge-entity-duong.test.ts probes/o-duong-that.test.ts
    ℹ duration_ms 2204.726542

- eval: E4
  run_id: minted-l2-bao-thu-doi-probe-that-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.judge_entity_khong_dau
  verified_at: 2026-11-15T23:05:25Z
  output: |
    cd agent && node --import tsx --test tests/judge-entity-khong-dau.test.ts probes/khong-dau-that.test.ts
    ℹ duration_ms 1382.829583

- eval: E5
  run_id: minted-l2-bao-thu-doi-probe-that-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.judge_luat
  verified_at: 2026-11-15T23:05:25Z
  output: |
    cd agent && node --import tsx --test tests/judge-luat.test.ts probes/judge-luat-that.test.ts
    ℹ duration_ms 905.012417

- eval: E6
  run_id: minted-l2-bao-thu-doi-probe-that-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.context_resolver_that
  verified_at: 2026-11-15T23:05:25Z
  output: |
    cd agent && node --import tsx --test tests/context-resolver.test.ts probes/context-resolver-that.test.ts
    ℹ duration_ms 419.372792

- eval: E7
  run_id: minted-l2-bao-thu-doi-probe-that-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.the_duyet_phuong
  verified_at: 2026-11-15T23:05:25Z
  output: |
    cd app && node --import tsx --test tests/the-duyet-phuong-lech-gia.test.tsx probes/the-duyet-phuong-that.test.tsx
    ℹ duration_ms 3518.1915

- eval: E9
  run_id: minted-l2-bao-thu-doi-probe-that-E9-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.test.probe_du_lieu_that
  verified_at: 2026-11-15T23:05:25Z
  output: |
    cd agent && node --import tsx --test probes/du-lieu-that.test.ts
    ✖ PT-AC-8 mục Probe dữ liệu thật chạy hai nhánh (2662.532333ms)
    AssertionError: PT-AC-8 lượt script để lại tệp đột biến
    actual [] / expected ['.cd-85138-0.ts']
    at probes/du-lieu-that.test.ts:48:10
    ℹ tests 2 · pass 1 · fail 1

- eval: E10
  run_id: minted-l2-bao-thu-doi-probe-that-E10-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.test.probe_du_lieu_that
  verified_at: 2026-11-15T23:05:25Z
  output: |
    cd agent && node --import tsx --test probes/du-lieu-that.test.ts
    ✔ PT-AC-9 tsconfig kiểm agent/probes (7129.814792ms)
    ℹ PT-AC-9: 0 lỗi trong probes/ · 0 lỗi tồn đọng ngoài probes (node_modules)
    Lệnh chung với E9 thoát khác 0 vì ca PT-AC-8 đỏ; ca PT-AC-9 tự nó xanh.

- eval: E11
  run_id: minted-l2-bao-thu-doi-probe-that-E11-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.agent
  verified_at: 2026-11-15T23:05:25Z
  output: |
    cd agent && npm test
    ℹ duration_ms 24758.83725

- eval: E12
  run_id: minted-l2-bao-thu-doi-probe-that-E12-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.app_ui
  verified_at: 2026-11-15T23:05:25Z
  output: |
    cd app && npm test
    ℹ duration_ms 396328.085667

### Lệnh suite (hồi quy)

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-l2-bao-thu-doi-probe-that-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-15T23:05:25Z

- cmd: cd pipeline && npm run test:a
  run_id: minted-l2-bao-thu-doi-probe-that-SUITE-test_a-r1
  exit_code: 0
  verified_at: 2026-11-15T23:05:25Z

- cmd: cd pipeline && npm run test:b
  run_id: minted-l2-bao-thu-doi-probe-that-SUITE-test_b-r1
  exit_code: 0
  verified_at: 2026-11-15T23:05:25Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-l2-bao-thu-doi-probe-that-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-15T23:05:25Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-l2-bao-thu-doi-probe-that-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-15T23:05:25Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — moi eval feature deu red tren baseline (co phan biet) o cac eval co do baseline (E1, E2, E3, E8, E11, E12); khong eval nao xanh ca hai phia.

Baseline khong do
- cd agent && node --import tsx --test tests/judge-entity-khong-dau.test.ts probes/khong-dau-that.test.ts: bo qua baseline: tep agent/probes/khong-dau-that.test.ts co o cay dang kiem nhung chua co o merge-base 1dbf52b25a0c692698dbfef49f7bf5eb5562ee05 — eval moi, chay tren code cu khong phan biet gi
- cd agent && node --import tsx --test tests/judge-luat.test.ts probes/judge-luat-that.test.ts: bo qua baseline: tep agent/probes/judge-luat-that.test.ts co o cay dang kiem nhung chua co o merge-base 1dbf52b25a0c692698dbfef49f7bf5eb5562ee05 — eval moi, chay tren code cu khong phan biet gi
- cd agent && node --import tsx --test tests/context-resolver.test.ts probes/context-resolver-that.test.ts: bo qua baseline: tep agent/probes/context-resolver-that.test.ts co o cay dang kiem nhung chua co o merge-base 1dbf52b25a0c692698dbfef49f7bf5eb5562ee05 — eval moi, chay tren code cu khong phan biet gi
- cd app && node --import tsx --test tests/the-duyet-phuong-lech-gia.test.tsx probes/the-duyet-phuong-that.test.tsx: bo qua baseline: tep app/probes/the-duyet-phuong-that.test.tsx co o cay dang kiem nhung chua co o merge-base 1dbf52b25a0c692698dbfef49f7bf5eb5562ee05 — eval moi, chay tren code cu khong phan biet gi
- cd agent && node --import tsx --test probes/du-lieu-that.test.ts: bo qua baseline: tep agent/probes/du-lieu-that.test.ts co o cay dang kiem nhung chua co o merge-base 1dbf52b25a0c692698dbfef49f7bf5eb5562ee05 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E9, E10 failed — lệnh probes/du-lieu-that.test.ts đỏ ở ca PT-AC-8 (lượt script để lại tệp đột biến .cd-85138-0.ts; ca PT-AC-9 xanh cùng lệnh). Returned to implementation.

