---
schema_version: 2
feature_slug: data-api-don-ten-nguon
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: a432dacb5b75a944d03490d106c7333763d5fc2f
human_signoff:
---

# Evidence Report: data-api-don-ten-nguon

Vòng 1. Cả năm eval của tính năng đều xanh, nhưng bốn lệnh suite hồi quy không gắn eval nào (agent, app_ui, pipeline_a, pipeline_b) báo thất bại, nên verdict tổng là REJECT. `failed_evals` để rỗng vì không eval nào đỏ.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-1 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-data-api-don-ten-nguon-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pb5_ten_nguon
  verified_at: 2026-11-25T16:55:03Z
  output: |
    lệnh: node --test scripts/data-api-ten-nguon.test.mjs
    ℹ duration_ms 336.8305

- eval: E2
  run_id: minted-data-api-don-ten-nguon-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pb5_ten_nguon
  verified_at: 2026-11-25T16:55:03Z
  output: |
    lệnh: node --test scripts/data-api-ten-nguon.test.mjs
    ℹ duration_ms 336.8305

- eval: E3
  run_id: minted-data-api-don-ten-nguon-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pb5_ten_nguon
  verified_at: 2026-11-25T16:55:03Z
  output: |
    lệnh: node --test scripts/data-api-ten-nguon.test.mjs
    ℹ duration_ms 336.8305

- eval: E4
  run_id: minted-data-api-don-ten-nguon-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pb5_db_mau
  verified_at: 2026-11-25T16:55:03Z
  output: |
    lệnh: bash scripts/data-api-ten-nguon-db.sh
    ℹ duration_ms 755.422956

- eval: E5
  run_id: minted-data-api-don-ten-nguon-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.pb5_luoi
  verified_at: 2026-11-25T16:55:03Z
  output: |
    lệnh: node scripts/data-api-ten-nguon.mjs
    data-api ten-nguon: SẠCH — ngoài định danh lược đồ đã biết, 0 cụm

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-data-api-don-ten-nguon-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r1
  exit_code: 1
  verified_at: 2026-11-25T16:55:03Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-data-api-don-ten-nguon-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-25T16:55:03Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-data-api-don-ten-nguon-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r1
  exit_code: 1
  verified_at: 2026-11-25T16:55:03Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-data-api-don-ten-nguon-SUITE-test_a-r1
  exit_code: 1
  verified_at: 2026-11-25T16:55:03Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-data-api-don-ten-nguon-SUITE-test_b-r1
  exit_code: 1
  verified_at: 2026-11-25T16:55:03Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-data-api-don-ten-nguon-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-25T16:55:03Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-data-api-don-ten-nguon-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r1
  exit_code: 0
  verified_at: 2026-11-25T16:55:03Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đều red trên baseline (có phân biệt) không áp dụng được: cả ba lệnh eval không có baseline đo (n-a), nên không có eval nào được xác nhận là không-phân-biệt.

Lệnh fail không gắn eval: bốn lệnh suite (agent, app_ui, pipeline_a, pipeline_b) thất bại và không thuộc eval nào. Đầu ra cho thấy nhiều tệp test bị báo «test failed» ngay ở dòng 1:1 (thất bại ở mức tệp, chưa chạy tới ca), cùng một ca ND-AC-8 «KHONG DU MAU» trong app_ui. Chưa xác định được đây là lỗi môi trường (DB mẫu, container) hay do thay đổi này; cần người xem trước khi sang vòng sau.

Baseline khong do
- node --test scripts/data-api-ten-nguon.test.mjs: bo qua baseline: tep scripts/data-api-ten-nguon.test.mjs co o cay dang kiem nhung chua co o merge-base 78ea448dddc3e5b51a037735a3d7ba302438e534 — eval moi, chay tren code cu khong phan biet gi
- bash scripts/data-api-ten-nguon-db.sh: bo qua baseline: tep scripts/data-api-ten-nguon-db.sh co o cay dang kiem nhung chua co o merge-base 78ea448dddc3e5b51a037735a3d7ba302438e534 — eval moi, chay tren code cu khong phan biet gi
- node scripts/data-api-ten-nguon.mjs: bo qua baseline: tep scripts/data-api-ten-nguon.mjs co o cay dang kiem nhung chua co o merge-base 78ea448dddc3e5b51a037735a3d7ba302438e534 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — mọi eval nhiều lần chạy đều đồng nhất (mọi eval chạy một lần, xác định).

## Iterations

Round 1: không eval nào đỏ; bốn lệnh suite hồi quy (agent, app_ui, pipeline_a, pipeline_b) thất bại và không gắn eval. Trả về để xử lý.
