---
schema_version: 2
feature_slug: anh-goc-qua-may-chu
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 71e5c44c7ea351f7b4d635ca098e8acd349fdc27
human_signoff:
---

# Evidence Report: anh-goc-qua-may-chu

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |
| E8 | AC-8 | script | PASS |
| E9 | AC-8 | script | PASS |
| E10 | AC-9 | ui-check | PASS |

## Evidence

- eval: E1
  run_id: minted-anh-goc-qua-may-chu-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.anh_goc
  verified_at: 2026-10-30T23:43:39Z
  output: |
    cd app && node --import tsx --test tests/anh-goc-qua-may-chu.test.tsx
    ℹ duration_ms 1302.191292

- eval: E2
  run_id: minted-anh-goc-qua-may-chu-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.anh_goc
  verified_at: 2026-10-30T23:43:39Z
  output: |
    cd app && node --import tsx --test tests/anh-goc-qua-may-chu.test.tsx
    ℹ duration_ms 1302.191292

- eval: E3
  run_id: minted-anh-goc-qua-may-chu-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.anh_goc
  verified_at: 2026-10-30T23:43:39Z
  output: |
    cd app && node --import tsx --test tests/anh-goc-qua-may-chu.test.tsx
    ℹ duration_ms 1302.191292

- eval: E4
  run_id: minted-anh-goc-qua-may-chu-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.anh_goc
  verified_at: 2026-10-30T23:43:39Z
  output: |
    cd app && node --import tsx --test tests/anh-goc-qua-may-chu.test.tsx
    ℹ duration_ms 1302.191292

- eval: E5
  run_id: minted-anh-goc-qua-may-chu-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.anh_goc
  verified_at: 2026-10-30T23:43:39Z
  output: |
    cd app && node --import tsx --test tests/anh-goc-qua-may-chu.test.tsx
    ℹ duration_ms 1302.191292

- eval: E6
  run_id: minted-anh-goc-qua-may-chu-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.anh_goc
  verified_at: 2026-10-30T23:43:39Z
  output: |
    cd app && node --import tsx --test tests/anh-goc-qua-may-chu.test.tsx
    ℹ duration_ms 1302.191292

- eval: E7
  run_id: minted-anh-goc-qua-may-chu-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.anh_goc_doi_chieu
  verified_at: 2026-10-30T23:43:39Z
  output: |
    cd app && node --import tsx --test tests/anh-goc-doi-chieu.test.tsx
    ℹ duration_ms 384.073625

- eval: E8
  run_id: minted-anh-goc-qua-may-chu-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.api_surface_static
  verified_at: 2026-10-30T23:43:39Z
  output: |
    node scripts/check-api-surface.mjs static
    api-surface static: ĐẠT

- eval: E9
  run_id: minted-anh-goc-qua-may-chu-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.portal_static
  verified_at: 2026-10-30T23:43:39Z
  output: |
    node scripts/check-portal-compliance.mjs
    portal-compliance: ĐẠT

- eval: E10
  run_id: minted-anh-goc-qua-may-chu-E10-r1
  exit_code: 0
  verifier: config:executors.ui_check
  verified_at: 2026-10-30T23:43:39Z
  screenshot: evidence/E10-step1.png
  observed: |
    E10-step1.png (đã mở bằng Read, 1280 px, giao diện sáng): ngăn chi tiết thẻ «Cùng căn? thanh-xuan 76m² ↔ 68m² (score 0.945)», #105729, nhãn Ghép căn / Chờ duyệt, nằm trên danh sách đã lọc «Tất cả». Cột phải (Tin B) có dải ảnh ngang với ít nhất ba ảnh căn hộ thật hiển thị, không phải khung hỏng. Tin A ghi «không có ảnh». Khớp Expected. DB xác nhận bên B của thẻ là S06 (offer_b.source = S06); ảnh nằm trên bên S06.
  network_observed: clean
  baseline: n-a

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-anh-goc-qua-may-chu-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-30T23:43:39Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-anh-goc-qua-may-chu-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-30T23:43:39Z

- cmd: cd app && npm test
  run_id: minted-anh-goc-qua-may-chu-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-10-30T23:43:39Z

- cmd: cd pipeline && npm test
  run_id: minted-anh-goc-qua-may-chu-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-10-30T23:43:39Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-anh-goc-qua-may-chu-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-30T23:43:39Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

Không đo được eval nào là không-phân-biệt ở round này (baseline không chạy).

### Baseline khong do

- cd app && node --import tsx --test tests/anh-goc-qua-may-chu.test.tsx: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- cd app && node --import tsx --test tests/anh-goc-doi-chieu.test.tsx: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- node scripts/check-api-surface.mjs static: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- node scripts/check-portal-compliance.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: tất cả eval máy và ui-check xanh; không có eval nào hỏng. Không có judgment item. Baseline không đo được do hạ tầng.
