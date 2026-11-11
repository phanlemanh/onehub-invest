---
schema_version: 2
feature_slug: do-san-sl1-kdm
verdict: REJECT
failed_evals: ["E3","E5"]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 245783c1ec46f3538c0921b57aec0192495c26fe
human_signoff:
---

# Evidence Report: do-san-sl1-kdm

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | FAIL |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | test | FAIL |

Lệnh fail không gắn eval: không có. Hai lệnh fail đều gắn eval: `node --test scripts/kiem-tin-rao-gan-khu-vuc.test.mjs` (E3) và `node --test scripts/*.test.mjs` (E5).

## Evidence

- eval: E1
  run_id: minted-do-san-sl1-kdm-E1-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.dsk_doc
  verified_at: 2026-11-10T23:16:17Z
  output: |
    kiem-tin-rao-gan: PASS

- eval: E2
  run_id: minted-do-san-sl1-kdm-E2-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.dsk_vi_tu
  verified_at: 2026-11-10T23:16:17Z
  output: |
    Ca KDM-PX1 xanh (chạy với --test-name-pattern=KDM-PX1).

- eval: E3
  run_id: minted-do-san-sl1-kdm-E3-r1
  exit_code: 1
  baseline: red
  verifier: config:executors.test.tin_rao_gan_do_test
  verified_at: 2026-11-10T23:16:17Z
  output: |
    ok   0 tin trỏ khu vực không hợp lệ hay khu vực mồi
    ok   tin mồi bị gỡ nhãn → thước báo đỏ (offer_5a7c77ee089068a8)
    FAIL ROLLBACK — băm lệch gốc: property_offers · ops_audit +0 dòng transform · 0 khu vực mồi
    kiem-tin-rao-gan: FAIL (1)
    AssertionError: 1 !== 0 (scripts/kiem-tin-rao-gan-khu-vuc.test.mjs:29)

- eval: E4
  run_id: minted-do-san-sl1-kdm-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dsk_khong_db_chung
  verified_at: 2026-11-10T23:16:17Z
  output: |
    khong-db-chung: xanh

- eval: E5
  run_id: r1-l5-1-20261110231617
  exit_code: 1
  baseline: red
  verifier: config:executors.test.scripts
  verified_at: 2026-11-10T23:16:17Z
  output: |
    ok   trạng thái trước có 6 tin mồi trỏ khu vực không hợp lệ (+ 0 tin thật)
    stg có giá+DT: 81094
    AssertionError: null !== 0 (scripts/kiem-tin-rao-gan-khu-vuc.test.mjs:29) — tiến trình con không trả mã thoát (null)

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-do-san-sl1-kdm-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-10T23:16:17Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-do-san-sl1-kdm-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-10T23:16:17Z

- cmd: cd app && npm test
  run_id: minted-do-san-sl1-kdm-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-11-10T23:16:17Z

- cmd: cd pipeline && npm test
  run_id: minted-do-san-sl1-kdm-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-11-10T23:16:17Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-do-san-sl1-kdm-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-10T23:16:17Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-do-san-sl1-kdm-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-10T23:16:17Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đều red trên baseline (có phân biệt). Riêng E4 baseline là n-a (xem bên dưới).

Baseline không đo:
- bash _acceptance/do-san-sl1-kdm/probes/khong-db-chung.sh: bỏ qua baseline: tệp _acceptance/do-san-sl1-kdm/probes/khong-db-chung.sh có ở cây đang kiểm nhưng chưa có ở merge-base 610074bf51f6e2427b3fdbda37e33def7dec3d53 — eval mới, chạy trên code cũ không phân biệt gì

## Variance

none — mọi eval nhiều lần chạy đều đồng đều (mọi eval chỉ chạy một lần, tất định).

## Iterations

Round 1: E3, E5 failed — bước ROLLBACK của KDM-AC-3 báo băm lệch gốc (`property_offers`, `ops_audit`, khu vực mồi) khiến test E3 đỏ; E5 chạy cùng test đó trong bộ `scripts/*.test.mjs` nên đỏ theo. Returned to implementation.
