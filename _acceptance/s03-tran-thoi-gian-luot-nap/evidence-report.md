---
schema_version: 2
feature_slug: s03-tran-thoi-gian-luot-nap
verdict: REJECT
failed_evals: ["E8b","E8d","E8f"]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 36bdef01cfaf1c08bda58bb3f916042dde4c0e20
human_signoff:
---

# Evidence Report: s03-tran-thoi-gian-luot-nap

Round 2. Kết luận REJECT: ba eval E8b, E8d, E8f đỏ, cùng một gốc là bộ test hồi quy đếm tệp nhắc zalo-import-daily (PL34-AC-4) lệch tập thật (13 thay vì 12), kèm một ca EC-AC-8 trong enrich-buoc-job.test.mjs. Các eval hành vi E1 tới E7, E8a, E8c, E8e, E9 xanh.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |
| E8a | AC-8 | test | PASS |
| E8b | AC-8 | test | FAIL |
| E8c | AC-8 | test | PASS |
| E8d | AC-8 | test | FAIL |
| E8e | AC-8 | test | PASS |
| E8f | AC-8 | test | FAIL |
| E9 | AC-9 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-s03-tran-thoi-gian-luot-nap-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/s03-tran-thoi-gian-luot-nap/probes/tran-unit.sh
  verified_at: 2026-11-20T17:20:56Z
  output: |
    Lệnh probes/tran-unit.sh phủ E1 tới E7 trong một lượt chạy, hoàn tất xanh.
    ℹ duration_ms 54522.9435

- eval: E2
  run_id: minted-s03-tran-thoi-gian-luot-nap-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/s03-tran-thoi-gian-luot-nap/probes/tran-unit.sh
  verified_at: 2026-11-20T17:20:56Z
  output: |
    Cùng lượt chạy probes/tran-unit.sh với E1, xanh.
    ℹ duration_ms 54522.9435

- eval: E3
  run_id: minted-s03-tran-thoi-gian-luot-nap-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/s03-tran-thoi-gian-luot-nap/probes/tran-unit.sh
  verified_at: 2026-11-20T17:20:56Z
  output: |
    Cùng lượt chạy probes/tran-unit.sh với E1, xanh.
    ℹ duration_ms 54522.9435

- eval: E4
  run_id: minted-s03-tran-thoi-gian-luot-nap-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/s03-tran-thoi-gian-luot-nap/probes/tran-unit.sh
  verified_at: 2026-11-20T17:20:56Z
  output: |
    Cùng lượt chạy probes/tran-unit.sh với E1, xanh.
    ℹ duration_ms 54522.9435

- eval: E5
  run_id: minted-s03-tran-thoi-gian-luot-nap-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/s03-tran-thoi-gian-luot-nap/probes/tran-unit.sh
  verified_at: 2026-11-20T17:20:56Z
  output: |
    Cùng lượt chạy probes/tran-unit.sh với E1, xanh.
    ℹ duration_ms 54522.9435

- eval: E6
  run_id: minted-s03-tran-thoi-gian-luot-nap-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/s03-tran-thoi-gian-luot-nap/probes/tran-unit.sh
  verified_at: 2026-11-20T17:20:56Z
  output: |
    Cùng lượt chạy probes/tran-unit.sh với E1, xanh.
    ℹ duration_ms 54522.9435

- eval: E7
  run_id: minted-s03-tran-thoi-gian-luot-nap-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/s03-tran-thoi-gian-luot-nap/probes/tran-unit.sh
  verified_at: 2026-11-20T17:20:56Z
  output: |
    Cùng lượt chạy probes/tran-unit.sh với E1, xanh.
    ℹ duration_ms 54522.9435

- eval: E8a
  run_id: minted-s03-tran-thoi-gian-luot-nap-E8a-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.jst_unit
  verified_at: 2026-11-20T17:20:56Z
  output: |
    node --test scripts/job-step-thoi-luong.test.mjs, gồm lưới phạm vi làn JST-AC-8, xanh.
    ℹ duration_ms 19147.190125

- eval: E8b
  run_id: minted-s03-tran-thoi-gian-luot-nap-E8b-r2
  exit_code: 1
  baseline: red
  verifier: config:executors.test.jst_regress
  verified_at: 2026-11-20T17:20:56Z
  output: |
    Hai ca đỏ trong năm bộ test job cũ:
    - scripts/enrich-buoc-job.test.mjs:173 EC-AC-8 chiều đỏ: nhả khoá mà không gỡ trap. Lỗi: Missing expected exception.
    - scripts/zalo-import-job.test.mjs:352 PL34-AC-4 số tệp quét lệch: 13 so với 12 kê trước.

- eval: E8c
  run_id: minted-s03-tran-thoi-gian-luot-nap-E8c-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.test.zalo_import_khoa
  verified_at: 2026-11-20T17:20:56Z
  output: |
    Khoá nạp trên DB thử oneinvest_suite_zik, xanh.
    ℹ duration_ms 424402.227667

- eval: E8d
  run_id: minted-s03-tran-thoi-gian-luot-nap-E8d-r2
  exit_code: 1
  baseline: green
  verifier: config:executors.test.zalo_import_job_lan
  verified_at: 2026-11-20T17:20:56Z
  output: |
    ℹ tests 4, pass 3, fail 1.
    Ca ZL-AC-2 nhánh ZCode sửa phần nạp đỏ giả: PL34-AC-4 tập tệp báo 1 so với 0 mong đợi.

- eval: E8e
  run_id: minted-s03-tran-thoi-gian-luot-nap-E8e-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/s03-tran-thoi-gian-luot-nap/probes/tran-unit-ci.sh
  verified_at: 2026-11-20T17:20:56Z
  output: |
    Chạy với HOME tạm không có node riêng của máy thu, xanh.
    ℹ duration_ms 54640.08725

- eval: E8f
  run_id: minted-s03-tran-thoi-gian-luot-nap-E8f-r2
  exit_code: 1
  baseline: n-a
  verifier: _acceptance/s03-tran-thoi-gian-luot-nap/probes/scripts-ci.sh
  verified_at: 2026-11-20T17:20:56Z
  output: |
    Trọn node --test scripts/*.test.mjs đỏ cùng gốc với E8b và E8d:
    - zalo-import-job.test.mjs:352 PL34-AC-4 số tệp quét 13 so với 12.
    - zalo-import-job-lan.test.mjs:67 ZL-AC-2 đỏ giả trên nhánh ZCode.

- eval: E9
  run_id: minted-s03-tran-thoi-gian-luot-nap-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/s03-tran-thoi-gian-luot-nap/ap-may-thu/do-luot-dem.test.sh
  verified_at: 2026-11-20T17:20:56Z
  output: |
    DO-LUOT-DEM OK

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-s03-tran-thoi-gian-luot-nap-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r2
  exit_code: 0
  verified_at: 2026-11-20T17:20:56Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-s03-tran-thoi-gian-luot-nap-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-20T17:20:56Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-s03-tran-thoi-gian-luot-nap-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r2
  exit_code: 0
  verified_at: 2026-11-20T17:20:56Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-s03-tran-thoi-gian-luot-nap-SUITE-test_a-r2
  exit_code: 0
  verified_at: 2026-11-20T17:20:56Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-s03-tran-thoi-gian-luot-nap-SUITE-test_b-r2
  exit_code: 0
  verified_at: 2026-11-20T17:20:56Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-s03-tran-thoi-gian-luot-nap-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-20T17:20:56Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-s03-tran-thoi-gian-luot-nap-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r2
  exit_code: 0
  verified_at: 2026-11-20T17:20:56Z

Lệnh đỏ không gắn eval riêng: không có. Ba lệnh đỏ đều gắn eval (E8b, E8d, E8f) và đã nêu ở trên.

Ghi chú judge: hợp đồng không khai eval judgment nào, nên không có panel và không có mục cần human_override.

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh cả ở HEAD lẫn baseline, chứng minh harness chứ không phải tính năng):
- node --test scripts/job-step-thoi-luong.test.mjs (E8a): regression-guard có chủ ý cho lưới phạm vi làn JST-AC-8.

Baseline không đo:
- bash _acceptance/s03-tran-thoi-gian-luot-nap/probes/tran-unit.sh: bo qua baseline: tep _acceptance/s03-tran-thoi-gian-luot-nap/probes/tran-unit.sh co o cay dang kiem nhung chua co o merge-base 718c893cae3c86adbb09cafb992224a187b17cf7 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/s03-tran-thoi-gian-luot-nap/probes/tran-unit-ci.sh: bo qua baseline: tep _acceptance/s03-tran-thoi-gian-luot-nap/probes/tran-unit-ci.sh co o cay dang kiem nhung chua co o merge-base 718c893cae3c86adbb09cafb992224a187b17cf7 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/s03-tran-thoi-gian-luot-nap/probes/scripts-ci.sh: bo qua baseline: tep _acceptance/s03-tran-thoi-gian-luot-nap/probes/scripts-ci.sh co o cay dang kiem nhung chua co o merge-base 718c893cae3c86adbb09cafb992224a187b17cf7 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/s03-tran-thoi-gian-luot-nap/ap-may-thu/do-luot-dem.test.sh: bo qua baseline: tep _acceptance/s03-tran-thoi-gian-luot-nap/ap-may-thu/do-luot-dem.test.sh co o cay dang kiem nhung chua co o merge-base 718c893cae3c86adbb09cafb992224a187b17cf7 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — mọi eval nhiều lần chạy đều đồng nhất (mọi eval chạy một lần, xác định).

## Iterations

Round 1: lịch sử round 1 không được truyền vào lượt soạn này; xem run-log.jsonl và các file round cũ.
Round 2: E8b, E8d, E8f đỏ — nhánh có 13 tệp nhắc zalo-import-daily (thêm scripts/zalo-import-tran-zcode.test.mjs do lần merge từ main) nên PL34-AC-4 kê 12 bị lệch; ca EC-AC-8 trong enrich-buoc-job.test.mjs cũng đỏ. Trả về triển khai.
