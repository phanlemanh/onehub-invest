---
schema_version: 2
feature_slug: judge-luat-loai-tru-dac-trung
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: efd3537bafd043c55ccb6e7a0338c702a460096e
human_signoff:
---

# Evidence Report: judge-luat-loai-tru-dac-trung

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
| E10 | AC-10 | test | PASS |
| E11 | AC-11 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-judge-luat-loai-tru-dac-trung-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.judge_luat
  verified_at: 2026-10-31T06:25:40Z
  output: |
    Lệnh: cd agent && node --import tsx --test tests/judge-luat.test.ts
    Ca 'LT-AC-1 ma trận đặc trưng' xanh (30 assert, kể cả hai chiều đỏ đột biến).

- eval: E2
  run_id: minted-judge-luat-loai-tru-dac-trung-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.judge_luat
  verified_at: 2026-10-31T06:25:40Z
  output: |
    Lệnh: cd agent && node --import tsx --test tests/judge-luat.test.ts
    Ca 'LT-AC-2 diện tích theo làm tròn và cách đo' xanh (14 assert).

- eval: E3
  run_id: minted-judge-luat-loai-tru-dac-trung-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.judge_luat
  verified_at: 2026-10-31T06:25:40Z
  output: |
    Lệnh: cd agent && node --import tsx --test tests/judge-luat.test.ts
    Ca 'LT-AC-3 lý do có mã' xanh.

- eval: E4
  run_id: minted-judge-luat-loai-tru-dac-trung-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.judge_luat
  verified_at: 2026-10-31T06:25:40Z
  output: |
    Lệnh: cd agent && node --import tsx --test tests/judge-luat.test.ts
    Ca 'LT-AC-4 khoá đường' xanh.

- eval: E5
  run_id: minted-judge-luat-loai-tru-dac-trung-E5-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.judge_nguong
  verified_at: 2026-10-31T06:25:40Z
  output: |
    Lệnh: cd agent && node --import tsx --test tests/judge-nguong.test.ts
    Mọi ca của judge-nguong.test.ts xanh với ma trận PL25 theo luật mới.

- eval: E6
  run_id: minted-judge-luat-loai-tru-dac-trung-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.judge_luat
  verified_at: 2026-10-31T06:25:40Z
  output: |
    Lệnh: cd agent && node --import tsx --test tests/judge-luat.test.ts
    Ca 'LT-AC-6 probe thẻ đã quyết' và 'LT-AC-6 bộ nạp cặp thật' xanh trên máy thu.

- eval: E7
  run_id: minted-judge-luat-loai-tru-dac-trung-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.judge_luat
  verified_at: 2026-10-31T06:25:40Z
  output: |
    Lệnh: cd agent && node --import tsx --test tests/judge-luat.test.ts
    Ca 'LT-AC-7 phiên bản' xanh (PHIEN_BAN_NGUONG pl25-2).

- eval: E8
  run_id: minted-judge-luat-loai-tru-dac-trung-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.judge_luat
  verified_at: 2026-10-31T06:25:40Z
  output: |
    Lệnh: cd agent && node --import tsx --test tests/judge-luat.test.ts
    Ca 'LT-AC-8 tầng và toà viết khác dạng' xanh.

- eval: E9
  run_id: minted-judge-luat-loai-tru-dac-trung-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.judge_luat
  verified_at: 2026-10-31T06:25:40Z
  output: |
    Lệnh: cd agent && node --import tsx --test tests/judge-luat.test.ts
    Ca 'LT-AC-9 khoá đường/toà/tầng của luật trùng thẻ duyệt' xanh (26 ô).

- eval: E10
  run_id: minted-judge-luat-loai-tru-dac-trung-E10-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.judge_luat
  verified_at: 2026-10-31T06:25:40Z
  output: |
    Lệnh: cd agent && node --import tsx --test tests/judge-luat.test.ts
    Ca 'LT-AC-10 đường viết không dấu' xanh.

- eval: E11
  run_id: minted-judge-luat-loai-tru-dac-trung-E11-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.judge_luat
  verified_at: 2026-10-31T06:25:40Z
  output: |
    Lệnh: cd agent && node --import tsx --test tests/judge-luat.test.ts
    Ca 'LT-AC-11 toà theo mã' xanh.

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-judge-luat-loai-tru-dac-trung-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-10-31T06:25:40Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-judge-luat-loai-tru-dac-trung-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-10-31T06:25:40Z

- cmd: cd app && npm test
  run_id: minted-judge-luat-loai-tru-dac-trung-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-10-31T06:25:40Z

- cmd: cd pipeline && npm test
  run_id: minted-judge-luat-loai-tru-dac-trung-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-10-31T06:25:40Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-judge-luat-loai-tru-dac-trung-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-10-31T06:25:40Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-judge-luat-loai-tru-dac-trung-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-10-31T06:25:40Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh trên cả HEAD lẫn baseline):
- cd agent && node --import tsx --test tests/judge-nguong.test.ts: E5 (hồi quy có chủ ý, ma trận PL25 giữ kết luận cũ dưới luật mới)

Baseline không đo:
- cd agent && node --import tsx --test tests/judge-luat.test.ts: bo qua baseline: tep agent/tests/judge-luat.test.ts co o cay dang kiem nhung chua co o merge-base b55c96c4c2c41bfb113c2bc89df1ea8bbc70cddf — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: lịch sử round đầu nằm trong run-log.jsonl của feature; báo cáo này thay thế toàn bộ nội dung round cũ.
Round 2: toàn bộ 11 eval và 6 lệnh suite xanh, verdict PASS.

