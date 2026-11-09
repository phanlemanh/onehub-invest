---
schema_version: 2
feature_slug: khoa-nguon-nghi-khi-ddl-sua
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: bd2a6a830039eaf307c2792a528962be3292babd
human_signoff:
---

# Evidence Report: khoa-nguon-nghi-khi-ddl-sua

Round 1. Verdict REJECT: bảy eval của feature (E1 đến E7) đều xanh, nhưng hai lệnh suite hồi quy không gắn eval nào đỏ (`cd app && npm test` và `cd pipeline && npm test`). Hai lệnh này nằm ngoài danh sách eval nên `failed_evals` để trống; chi tiết ở mục Lệnh suite bên dưới.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-5 | test | PASS |
| E7 | AC-6 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-khoa-nguon-nghi-khi-ddl-sua-E1-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.kn_ldr
  verified_at: 2026-11-09T09:22:10Z
  output: |
    cd pipeline && bash ../db/db-thu.sh oneinvest_suite_kn --chay node --test --test-concurrency=1 --test-name-pattern=^KN- scripts/luoc-do-rieng.test.mjs
    ℹ duration_ms 3658.212958

- eval: E2
  run_id: minted-khoa-nguon-nghi-khi-ddl-sua-E2-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.kn_ldr
  verified_at: 2026-11-09T09:22:10Z
  output: |
    cùng lệnh với E1 (ca KN-AC-2)
    ℹ duration_ms 3658.212958

- eval: E3
  run_id: minted-khoa-nguon-nghi-khi-ddl-sua-E3-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.kn_ldr
  verified_at: 2026-11-09T09:22:10Z
  output: |
    cùng lệnh với E1 (ca KN-AC-3)
    ℹ duration_ms 3658.212958

- eval: E4
  run_id: minted-khoa-nguon-nghi-khi-ddl-sua-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.kn_dot_bien
  verified_at: 2026-11-09T09:22:10Z
  output: |
    DOT BIEN OK

- eval: E5
  run_id: minted-khoa-nguon-nghi-khi-ddl-sua-E5-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.kn_hoi_quy_pipe
  verified_at: 2026-11-09T09:22:10Z
  output: |
    bảy tệp test pipeline dùng thư viện
    ℹ duration_ms 35432.601209

- eval: E6
  run_id: minted-khoa-nguon-nghi-khi-ddl-sua-E6-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.kn_hoi_quy_app
  verified_at: 2026-11-09T09:22:10Z
  output: |
    ba tệp test app dùng thư viện
    ℹ duration_ms 40199.397625

- eval: E7
  run_id: minted-khoa-nguon-nghi-khi-ddl-sua-E7-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.kn_ldr
  verified_at: 2026-11-09T09:22:10Z
  output: |
    cùng lệnh với E1 (ca KN-AC-6)
    ℹ duration_ms 3658.212958

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-khoa-nguon-nghi-khi-ddl-sua-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-09T09:22:10Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-khoa-nguon-nghi-khi-ddl-sua-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-09T09:22:10Z

- cmd: cd app && npm test
  run_id: minted-khoa-nguon-nghi-khi-ddl-sua-SUITE-npm_test__bd9a35-r1
  exit_code: 1
  verified_at: 2026-11-09T09:22:10Z
  note: 1088 ca, 1082 qua, 1 hỏng, 5 bỏ qua. Ca hỏng là E4B-AC-3 ở tests/tin-rao-doi-chieu.test.tsx, phép đo thời gian "mỗi sort bản mới dưới 700 ms" ra "BIEN price-desc 704 ms". Ca này đo độ trễ sort, không dùng thư viện khoaNguon.

- cmd: cd pipeline && npm test
  run_id: minted-khoa-nguon-nghi-khi-ddl-sua-SUITE-npm_test__13563d-r1
  exit_code: 1
  verified_at: 2026-11-09T09:22:10Z
  note: có ca hỏng ở scripts/nap-dvhc-cu.test.mjs (PX1-AC-10 chiều đỏ), lỗi khoá ngoại sale_offers_area_id_fkey khi xoá dòng areas vn-da-nang-hoang-sa còn được sale_offer_records tham chiếu.

- cmd: cd app && npm run test:lint-rules
  run_id: minted-khoa-nguon-nghi-khi-ddl-sua-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-09T09:22:10Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-khoa-nguon-nghi-khi-ddl-sua-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-09T09:22:10Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh cả trên HEAD lẫn baseline, chứng minh harness chứ không chứng minh feature; cần viết lại để assert hành vi mới hoặc xác nhận là regression-guard có chủ ý):

- cd pipeline && bash ../db/db-thu.sh oneinvest_suite_kn --chay node --test --test-concurrency=1 --test-name-pattern=^KN- scripts/luoc-do-rieng.test.mjs: E1, E2, E3, E7
- cd pipeline && bash ../db/db-thu.sh oneinvest_suite_knhq --chay node --test --test-concurrency=1 scripts/luoc-do-rieng.test.mjs scripts/so-ghep-s06.test.mjs scripts/bait-gap-sellers.test.mjs scripts/gan-sdt-s06.test.mjs scripts/importer-schema-v5.test.mjs scripts/kiem-do-sau-070.test.mjs scripts/deals-phi-ly.test.mjs: E5
- cd app && bash ../db/db-thu.sh oneinvest_suite_knapp --chay node --import tsx --test --test-concurrency=1 tests/deals-phi-ly.test.tsx tests/dq-moi-nhat.test.tsx tests/can-gia-tot-biet-can.test.tsx: E6

Lệnh fail không gắn eval: `cd app && npm test` (một ca thời gian E4B-AC-3 sort 704 ms so với trần 700 ms, có vẻ nhạy tải máy) và `cd pipeline && npm test` (ca PX1-AC-10 của nap-dvhc-cu.test.mjs, vi phạm khoá ngoại trên DB dùng chung). Không lệnh nào trong hai lệnh này nằm trong danh sách eval của feature; cần người xét ở Cổng 2 xem có phải hỏng sẵn từ trước hay do thay đổi này.

### Baseline khong do

- cd pipeline && bash ../db/db-thu.sh oneinvest_suite_kndb --chay node ../_acceptance/khoa-nguon-nghi-khi-ddl-sua/probes/dot-bien.mjs: bo qua baseline: tep _acceptance/khoa-nguon-nghi-khi-ddl-sua/probes/dot-bien.mjs co o cay dang kiem nhung chua co o merge-base 773a0040dc5ac65bfafbc0e3cb8ba5eea7d877df — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: bảy eval E1 đến E7 xanh; hai lệnh suite không gắn eval (`cd app && npm test`, `cd pipeline && npm test`) đỏ. Trả về triển khai/người xét.
