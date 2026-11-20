---
schema_version: 2
feature_slug: s02-luot-loi-sach-va-kiem-han-token
verdict: REJECT
failed_evals: [E6]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 356a395ec0f7bfa53bfcc19f8e5f4957add31b55
human_signoff:
---

# Evidence Report: s02-luot-loi-sach-va-kiem-han-token

Round 1. Một eval hỏng: E6 (AC-6). Lệnh hỏng duy nhất là `bash _acceptance/s02-luot-loi-sach-va-kiem-han-token/probes/vung.sh`, đã gắn với E6.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | REJECT |
| E7 | AC-6 | test | PASS |
| E8 | AC-1 | script | PASS |
| E9 | AC-2 | script | PASS |
| E10a | AC-6 | test | PASS |
| E10b | AC-6 | test | PASS |
| E10c | AC-6 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-s02-luot-loi-sach-va-kiem-han-token-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.collector
  verified_at: 2026-11-20T20:12:45Z
  output: |
    ℹ duration_ms 110289.431834

- eval: E7
  run_id: minted-s02-luot-loi-sach-va-kiem-han-token-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.collector
  verified_at: 2026-11-20T20:12:45Z
  output: |
    ℹ duration_ms 110289.431834

- eval: E2
  run_id: minted-s02-luot-loi-sach-va-kiem-han-token-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/s02-luot-loi-sach-va-kiem-han-token/probes/noi-day.sh
  verified_at: 2026-11-20T20:12:45Z
  output: |
    XANH

- eval: E5
  run_id: minted-s02-luot-loi-sach-va-kiem-han-token-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/s02-luot-loi-sach-va-kiem-han-token/probes/noi-day.sh
  verified_at: 2026-11-20T20:12:45Z
  output: |
    XANH

- eval: E3
  run_id: minted-s02-luot-loi-sach-va-kiem-han-token-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/s02-luot-loi-sach-va-kiem-han-token/probes/nguoi-doc.mjs
  verified_at: 2026-11-20T20:12:45Z
  output: |
    ĐỎ: 1 điều kiện hỏng (chiều đỏ --pha, đúng kỳ vọng)

- eval: E8
  run_id: minted-s02-luot-loi-sach-va-kiem-han-token-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/s02-luot-loi-sach-va-kiem-han-token/probes/nguoi-doc.mjs
  verified_at: 2026-11-20T20:12:45Z
  output: |
    ĐỎ: 1 điều kiện hỏng (chiều đỏ --pha, đúng kỳ vọng)

- eval: E4
  run_id: minted-s02-luot-loi-sach-va-kiem-han-token-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/s02-luot-loi-sach-va-kiem-han-token/probes/dot-bien-han.mjs
  verified_at: 2026-11-20T20:12:45Z
  output: |
    XANH: 8/8 ô bản thật đạt, hai đột biến bị bắt

- eval: E9
  run_id: minted-s02-luot-loi-sach-va-kiem-han-token-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/s02-luot-loi-sach-va-kiem-han-token/probes/dot-bien-han.mjs
  verified_at: 2026-11-20T20:12:45Z
  output: |
    XANH: 8/8 ô bản thật đạt, hai đột biến bị bắt

- eval: E6
  run_id: minted-s02-luot-loi-sach-va-kiem-han-token-E6-r1
  exit_code: 1
  baseline: n-a
  verifier: _acceptance/s02-luot-loi-sach-va-kiem-han-token/probes/vung.sh
  verified_at: 2026-11-20T20:12:45Z
  output: |
    tệp đổi so với db971b8c541fb60364909e299dfe87d305329ee9: 20
    đạt: chiều đỏ — cấy pipeline/transform-ngoai-vung.mjs thì bộ lọc gọi tên nó
    đạt: có tệp bộ thu S02 (xuất kiemAppToken)
    đạt: có collector/src/core/scheduler.ts
    đạt: có collector/src/core/storage.ts
    đạt: có collector/src/test/snapshot-loi-khong-tac-thu-muc.test.ts
    đạt: có collector/src/test/apptoken-exp.test.ts
    ĐỎ: tệp ngoài vùng: LO-TRINH.html
    PRODUCT-MAP.md

- eval: E10a
  run_id: r1-l6-1-20261120201245
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.app_ui
  verified_at: 2026-11-20T20:12:45Z
  output: |
    suite-neu-doi: bỏ qua app_ui: không đổi app/**, agent/**, pipeline/**, scripts/** … (+8) (7 tệp đổi ngoài vùng)

- eval: E10b
  run_id: minted-s02-luot-loi-sach-va-kiem-han-token-E10b-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_a
  verified_at: 2026-11-20T20:12:45Z
  output: |
    ℹ duration_ms 1235664.331333

- eval: E10c
  run_id: minted-s02-luot-loi-sach-va-kiem-han-token-E10c-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_b
  verified_at: 2026-11-20T20:12:45Z
  output: |
    ℹ duration_ms 952123.759792

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-s02-luot-loi-sach-va-kiem-han-token-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r1
  exit_code: 0
  verified_at: 2026-11-20T20:12:45Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-s02-luot-loi-sach-va-kiem-han-token-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-20T20:12:45Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-s02-luot-loi-sach-va-kiem-han-token-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-20T20:12:45Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-s02-luot-loi-sach-va-kiem-han-token-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r1
  exit_code: 0
  verified_at: 2026-11-20T20:12:45Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đều red trên baseline (có phân biệt)

Baseline không đo:
- cd collector && npm test: exit 127 — lệnh/script không tồn tại ở chỗ đúng (command not found) — HẠ TẦNG CHẬM, không phải sản phẩm đo
- bash _acceptance/s02-luot-loi-sach-va-kiem-han-token/probes/noi-day.sh: bỏ qua baseline: tệp _acceptance/s02-luot-loi-sach-va-kiem-han-token/probes/noi-day.sh có ở cây đang kiểm nhưng chưa có ở merge-base db971b8c541fb60364909e299dfe87d305329ee9 — eval mới, chạy trên code cũ không phân biệt gì
- cd collector && npx tsc -p tsconfig.json && cd .. && node _acceptance/s02-luot-loi-sach-va-kiem-han-token/probes/nguoi-doc.mjs && ! node _acceptance/s02-luot-loi-sach-va-kiem-han-token/probes/nguoi-doc.mjs --pha: bỏ qua baseline: tệp _acceptance/s02-luot-loi-sach-va-kiem-han-token/probes/nguoi-doc.mjs có ở cây đang kiểm nhưng chưa có ở merge-base db971b8c541fb60364909e299dfe87d305329ee9 — eval mới, chạy trên code cũ không phân biệt gì
- cd collector && npx tsc -p tsconfig.json && cd .. && node _acceptance/s02-luot-loi-sach-va-kiem-han-token/probes/dot-bien-han.mjs: bỏ qua baseline: tệp _acceptance/s02-luot-loi-sach-va-kiem-han-token/probes/dot-bien-han.mjs có ở cây đang kiểm nhưng chưa có ở merge-base db971b8c541fb60364909e299dfe87d305329ee9 — eval mới, chạy trên code cũ không phân biệt gì
- bash _acceptance/s02-luot-loi-sach-va-kiem-han-token/probes/vung.sh: bỏ qua baseline: tệp _acceptance/s02-luot-loi-sach-va-kiem-han-token/probes/vung.sh có ở cây đang kiểm nhưng chưa có ở merge-base db971b8c541fb60364909e299dfe87d305329ee9 — eval mới, chạy trên code cũ không phân biệt gì

## Variance

none — mọi eval nhiều lần chạy đều đồng nhất

## Iterations

Round 1: E6 failed — phép đo vùng thấy LO-TRINH.html và PRODUCT-MAP.md (tệp sinh) đổi ngoài vùng cho phép. Trả về triển khai.
