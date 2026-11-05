---
schema_version: 2
feature_slug: nhom-hai-lan-s03-xu-goc
verdict: REJECT
failed_evals: []
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: be21a0000c00fc17546e87cde61d296e50eeaa07
human_signoff:
---

# Evidence Report: nhom-hai-lan-s03-xu-goc

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
| E9 | AC-9 | script | PASS |
| E10 | AC-10 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-nhom-hai-lan-s03-xu-goc-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.nhl_transform
  verified_at: 2026-11-05T11:21:05Z
  output: |
    NHOM HAI LAN TRANSFORM OK

- eval: E2
  run_id: minted-nhom-hai-lan-s03-xu-goc-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.nhl_transform
  verified_at: 2026-11-05T11:21:05Z
  output: |
    NHOM HAI LAN TRANSFORM OK

- eval: E3
  run_id: minted-nhom-hai-lan-s03-xu-goc-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.nhl_transform
  verified_at: 2026-11-05T11:21:05Z
  output: |
    NHOM HAI LAN TRANSFORM OK

- eval: E4
  run_id: minted-nhom-hai-lan-s03-xu-goc-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.nhl_cong
  verified_at: 2026-11-05T11:21:05Z
  output: |
    CONG NHOM HAI LAN OK

- eval: E7
  run_id: minted-nhom-hai-lan-s03-xu-goc-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.nhl_cong
  verified_at: 2026-11-05T11:21:05Z
  output: |
    CONG NHOM HAI LAN OK

- eval: E5
  run_id: minted-nhom-hai-lan-s03-xu-goc-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.nhl_so
  verified_at: 2026-11-05T11:21:05Z
  output: |
    DON NHOM HAI LAN OK

- eval: E6
  run_id: minted-nhom-hai-lan-s03-xu-goc-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.nhl_so
  verified_at: 2026-11-05T11:21:05Z
  output: |
    DON NHOM HAI LAN OK

- eval: E8
  run_id: minted-nhom-hai-lan-s03-xu-goc-E8-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.script.ndk_that
  verified_at: 2026-11-05T11:21:05Z
  output: |
    THAT CHI DOC OK

- eval: E9
  run_id: minted-nhom-hai-lan-s03-xu-goc-E9-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.script.ndk_that
  verified_at: 2026-11-05T11:21:05Z
  output: |
    THAT CHI DOC OK

- eval: E10
  run_id: minted-nhom-hai-lan-s03-xu-goc-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.nhl_quet
  verified_at: 2026-11-05T11:21:05Z
  output: |
    QUET NHOM HAI LAN OK

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-nhom-hai-lan-s03-xu-goc-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-05T11:21:05Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-nhom-hai-lan-s03-xu-goc-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-05T11:21:05Z

- cmd: cd app && npm test
  run_id: minted-nhom-hai-lan-s03-xu-goc-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-11-05T11:21:05Z

- cmd: cd pipeline && npm test
  run_id: minted-nhom-hai-lan-s03-xu-goc-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-11-05T11:21:05Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-nhom-hai-lan-s03-xu-goc-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-05T11:21:05Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-nhom-hai-lan-s03-xu-goc-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-05T11:21:05Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh trên cả nhánh lẫn baseline, chứng minh khung đo chứ không phải tính năng; cần viết lại để khẳng định hành vi mới hoặc xác nhận là lớp chặn hồi quy có chủ ý):

- E8, E9 (lệnh `node _acceptance/nhom-dang-ky-hai-lan-s03/probes/that-chi-doc.mjs`): baseline green.

Baseline không đo:

- bash db/db-thu.sh oneinvest_nhl_xu --neu-chua-co && DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_nhl_xu node pipeline/scripts/nhom-hai-lan-transform.itest.mjs: bo qua baseline: tep pipeline/scripts/nhom-hai-lan-transform.itest.mjs co o cay dang kiem nhung chua co o merge-base e50741fc8b1368098d2d7d4c5c4a1efc6b364c0a — eval moi, chay tren code cu khong phan biet gi
- bash db/db-thu.sh oneinvest_nhl_xu --neu-chua-co && DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_nhl_xu node pipeline/scripts/do-nhom-hai-lan.mjs --cong: bo qua baseline: tep pipeline/scripts/do-nhom-hai-lan.mjs co o cay dang kiem nhung chua co o merge-base e50741fc8b1368098d2d7d4c5c4a1efc6b364c0a — eval moi, chay tren code cu khong phan biet gi
- bash db/db-thu.sh oneinvest_nhl_xu --neu-chua-co && DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_nhl_xu node pipeline/scripts/don-nhom-hai-lan.itest.mjs: bo qua baseline: tep pipeline/scripts/don-nhom-hai-lan.itest.mjs co o cay dang kiem nhung chua co o merge-base e50741fc8b1368098d2d7d4c5c4a1efc6b364c0a — eval moi, chay tren code cu khong phan biet gi
- bash db/db-thu.sh oneinvest_nhl_xu --neu-chua-co && DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_nhl_xu node pipeline/scripts/do-nhom-hai-lan.mjs --quet: bo qua baseline: tep pipeline/scripts/do-nhom-hai-lan.mjs co o cay dang kiem nhung chua co o merge-base e50741fc8b1368098d2d7d4c5c4a1efc6b364c0a — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: không eval máy nào đỏ, nhưng ba phát hiện trong hợp đồng (hai về AC-3, một về AC-6, chi tiết ở review-findings.md) cho thấy phép đo xanh rỗng hoặc hành vi thật trái lời hứa của AC. Trả về triển khai.
