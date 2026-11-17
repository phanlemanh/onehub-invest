---
schema_version: 2
feature_slug: trang-danh-ba-chi-doc
verdict: PASS
failed_evals: []
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: f074ad699c2579997d997f8055c4f1dfaa8828ff
human_signoff:
---

# Evidence Report: trang-danh-ba-chi-doc

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |
| E8 | AC-8 | test | PASS |
| E9 | AC-9 | test | PASS |
| E10 | AC-9 | test | PASS |
| E11 | AC-9 | test | PASS |
| E12 | AC-10 | ui-check | PASS |
| E13 | AC-10 | script | PASS |
| E14 | AC-10 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-trang-danh-ba-chi-doc-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tdb_app
  verified_at: 2026-11-17T01:31:50Z
  output: |
    Ca TDB-AC-1 trong tests/registry-chi-doc.test.tsx xanh trên lược đồ tạm (db-thu.sh oneinvest_suite_tdb).

- eval: E2
  run_id: minted-trang-danh-ba-chi-doc-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tdb_app
  verified_at: 2026-11-17T01:31:50Z
  output: |
    Ca TDB-AC-2 trong tests/registry-chi-doc.test.tsx xanh trên lược đồ tạm.

- eval: E3
  run_id: minted-trang-danh-ba-chi-doc-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tdb_app
  verified_at: 2026-11-17T01:31:50Z
  output: |
    Ca TDB-AC-3 trong tests/registry-chi-doc.test.tsx xanh trên lược đồ tạm.

- eval: E4
  run_id: minted-trang-danh-ba-chi-doc-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tdb_app
  verified_at: 2026-11-17T01:31:50Z
  output: |
    Ca TDB-AC-4 trong tests/registry-chi-doc.test.tsx xanh trên lược đồ tạm.

- eval: E5
  run_id: minted-trang-danh-ba-chi-doc-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tdb_app
  verified_at: 2026-11-17T01:31:50Z
  output: |
    Ca TDB-AC-5 trong tests/registry-chi-doc.test.tsx xanh trên lược đồ tạm.

- eval: E6
  run_id: minted-trang-danh-ba-chi-doc-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tdb_app
  verified_at: 2026-11-17T01:31:50Z
  output: |
    Ca TDB-AC-6 trong tests/registry-chi-doc.test.tsx xanh trên lược đồ tạm.

- eval: E7
  run_id: minted-trang-danh-ba-chi-doc-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tdb_app
  verified_at: 2026-11-17T01:31:50Z
  output: |
    Ca TDB-AC-7 trong tests/registry-chi-doc.test.tsx xanh trên lược đồ tạm.

- eval: E8
  run_id: minted-trang-danh-ba-chi-doc-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tdb_app
  verified_at: 2026-11-17T01:31:50Z
  output: |
    Ca TDB-AC-8 trong tests/registry-chi-doc.test.tsx xanh trên lược đồ tạm.

- eval: E9
  run_id: minted-trang-danh-ba-chi-doc-E9-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.ui_route_slugs
  verified_at: 2026-11-17T01:31:50Z
  output: |
    route-slugs.test.mjs xanh.

- eval: E10
  run_id: minted-trang-danh-ba-chi-doc-E10-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.ui_routes_map
  verified_at: 2026-11-17T01:31:50Z
  output: |
    routes-map.test.mjs xanh.

- eval: E11
  run_id: minted-trang-danh-ba-chi-doc-E11-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tdb_app
  verified_at: 2026-11-17T01:31:50Z
  output: |
    Ca TDB-AC-9 trong tests/registry-chi-doc.test.tsx xanh trên lược đồ tạm.

- eval: E12
  run_id: minted-trang-danh-ba-chi-doc-E12-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.ui_check.registry
  verified_at: 2026-11-17T01:31:50Z
  screenshot: evidence/E12-step1.png
  observed: |
    step1 (1280 sáng): bốn ô số Dự án 344 / Toà 198 / Căn 1.748 / Mã nguồn chưa nối 524 rõ ràng; bảng Dự án có cột Nguồn chỉ là badge S06, S08; Tin đang rao dạng S03 4.131, S06 581. step2: hàng Vinhomes Ocean Park 1 mở, hiện phân khu The Paris, The Zurich, The Beverly, The Pavilion, The Zenpark, Ngọc Trai với badge S09. step3: bộ lọc «Chỗ thiếu là Có toà chưa có căn», nhãn 2/344 dự án, bảng còn Grand Park và Ocean Park 1, phân trang 1–2 / 2. step4 (tối): trang Vinhomes Grand Park đọc được, bốn ô Phân khu 18 / Toà 77 / Căn 1.430 / Tin đang rao 4.712 (S03 4.131 · S06 581), tab Mọi toà 77 / Chưa có căn 26, bảng toà có Bậc, Nguồn S0x, Trục, Căn. step5 (tối): toà B mở ra hai căn 772/B.02.10 «Tầng 2 · Trục 772/B/10» và 772/B.27.11 «Tầng 27 · Trục 772/B/11», nguồn S08. step6 (tối): tab Chưa có căn đang chọn, hàng GH3, GH5, S1.01... huy hiệu «Một lời khai» và «Chưa có căn» đọc rõ. step7 (390 sáng): bố cục một cột, bốn thẻ xếp dọc, không tràn ngang, scrollWidth 390 = clientWidth 390. Sidebar có email tài khoản thử ops-test@local.test (tài khoản thử cục bộ).
  network_observed: n-a (driver)

- eval: E13
  run_id: minted-trang-danh-ba-chi-doc-E13-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.design.floor
  verified_at: 2026-11-17T01:31:50Z
  output: |
    design-floor-s4 bậc M1 không báo hex thô mới.

- eval: E14
  run_id: minted-trang-danh-ba-chi-doc-E14-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tdb_doi_chieu
  verified_at: 2026-11-17T01:31:50Z
  output: |
    Ca TDB-DC đối chiếu chỉ-đọc trên DB máy thu :5433 xanh.

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-trang-danh-ba-chi-doc-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-17T01:31:50Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-trang-danh-ba-chi-doc-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-17T01:31:50Z

- cmd: cd app && npm test
  run_id: minted-trang-danh-ba-chi-doc-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-11-17T01:31:50Z

- cmd: cd pipeline && npm run test:a
  run_id: minted-trang-danh-ba-chi-doc-SUITE-test_a-r1
  exit_code: 0
  verified_at: 2026-11-17T01:31:50Z

- cmd: cd pipeline && npm run test:b
  run_id: minted-trang-danh-ba-chi-doc-SUITE-test_b-r1
  exit_code: 0
  verified_at: 2026-11-17T01:31:50Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-trang-danh-ba-chi-doc-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-17T01:31:50Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-trang-danh-ba-chi-doc-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-17T01:31:50Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh cả trên HEAD lẫn baseline; là regression-guard có chủ ý hoặc cần viết lại để assert hành vi mới): E9, E10, E13.

Baseline không đo:
- cd app && bash ../db/db-thu.sh oneinvest_suite_tdb --chay node --import tsx --test --test-concurrency=1 tests/registry-chi-doc.test.tsx: bo qua baseline: tep app/tests/registry-chi-doc.test.tsx co o cay dang kiem nhung chua co o merge-base ac6cb449fcfed4eefab4f9ec0a190fd61a490d97 — eval moi, chay tren code cu khong phan biet gi
- cd app && node --import tsx --test tests/registry-doi-chieu.test.tsx: bo qua baseline: tep app/tests/registry-doi-chieu.test.tsx co o cay dang kiem nhung chua co o merge-base ac6cb449fcfed4eefab4f9ec0a190fd61a490d97 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: mọi eval xanh (E1–E14) và mọi lệnh suite xanh; verdict PASS. Các phát hiện của vòng review nằm ở review-findings.md.
