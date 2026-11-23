---
schema_version: 2
feature_slug: model-may-sang-haiku
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 7f73564bb8fc13aca23403bc4ec12a7af785214a
human_signoff:
---

# Evidence Report: model-may-sang-haiku

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | test | PASS |
| E2b | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |
| E8 | AC-8 | script | PASS |
| E9a | AC-9 | test | PASS |
| E9b | AC-9 | test | PASS |
| E9c | AC-9 | test | PASS |
| E9d | AC-9 | test | PASS |
| E10 | AC-10 | script | PASS |

## Evidence

- eval: E1
  run_id: r2-l1-1-20261123004532
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/model-may-sang-haiku/probes/khong-goi-8000.mjs
  verified_at: 2026-11-23T00:45:32Z
  output: |
    AC-1 ĐẠT: 0 lời gọi MTPLX, mỗi lệnh gọi model cloud (enrich-run, judge-run, smoke đi Anthropic thẳng), mã sản xuất sạch

- eval: E2
  run_id: minted-model-may-sang-haiku-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: agent/tests/model-agent.test.ts
  verified_at: 2026-11-23T00:45:32Z
  output: |
    cd agent && node --import tsx --test tests/model-agent.test.ts: toàn bộ ca đạt

- eval: E3
  run_id: minted-model-may-sang-haiku-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: agent/tests/model-agent.test.ts
  verified_at: 2026-11-23T00:45:32Z
  output: |
    cùng lượt chạy tệp model-agent.test.ts với E2 và E6: toàn bộ ca đạt

- eval: E6
  run_id: minted-model-may-sang-haiku-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: agent/tests/model-agent.test.ts
  verified_at: 2026-11-23T00:45:32Z
  output: |
    cùng lượt chạy tệp model-agent.test.ts với E2 và E3: toàn bộ ca đạt

- eval: E2b
  run_id: minted-model-may-sang-haiku-E2b-r2
  exit_code: 0
  baseline: n-a
  verifier: agent/tests/duong-goi-agent.test.ts
  verified_at: 2026-11-23T00:45:32Z
  output: |
    cd agent && node --import tsx --test tests/duong-goi-agent.test.ts: toàn bộ ca đạt

- eval: E4
  run_id: minted-model-may-sang-haiku-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: agent/tests/du-lieu-gui-agent.itest.ts
  verified_at: 2026-11-23T00:45:32Z
  output: |
    itest du-lieu-gui-agent trên DB thử oneinvest_suite_mh1g: toàn bộ ca đạt

- eval: E5
  run_id: minted-model-may-sang-haiku-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: agent/tests/tran-tien-agent.itest.ts
  verified_at: 2026-11-23T00:45:32Z
  output: |
    itest tran-tien-agent trên DB thử oneinvest_suite_mh1t: toàn bộ ca đạt

- eval: E10
  run_id: minted-model-may-sang-haiku-E10-r2
  exit_code: 0
  baseline: n-a
  verifier: agent/tests/tran-tien-agent.itest.ts
  verified_at: 2026-11-23T00:45:32Z
  output: |
    cùng lượt chạy itest tran-tien-agent với E5: toàn bộ ca đạt

- eval: E7
  run_id: minted-model-may-sang-haiku-E7-r2
  exit_code: 0
  baseline: green
  verifier: pipeline/tests/vlm-anh.test.mjs
  verified_at: 2026-11-23T00:45:32Z
  output: |
    node --test pipeline/tests/vlm-anh.test.mjs: toàn bộ ca đạt

- eval: E8
  run_id: minted-model-may-sang-haiku-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/model-may-sang-haiku/probes/do-truoc-sau.mjs
  verified_at: 2026-11-23T00:45:32Z
  output: |
    AC-8 ĐẠT

- eval: E9a
  run_id: minted-model-may-sang-haiku-E9a-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.suite.agent
  verified_at: 2026-11-23T00:45:32Z
  output: |
    cd agent && npm test: toàn bộ ca đạt

- eval: E9b
  run_id: minted-model-may-sang-haiku-E9b-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.suite.pipeline_a
  verified_at: 2026-11-23T00:45:32Z
  output: |
    cd pipeline && npm run test:a: toàn bộ ca đạt

- eval: E9c
  run_id: r2-l10-1-20261123004532
  exit_code: 0
  baseline: n-a
  verifier: config:executors.suite.pipeline_b
  verified_at: 2026-11-23T00:45:32Z
  output: |
    cd pipeline && npm run test:b: toàn bộ ca đạt

- eval: E9d
  run_id: minted-model-may-sang-haiku-E9d-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.scripts
  verified_at: 2026-11-23T00:45:32Z
  output: |
    node --test scripts/*.test.mjs: toàn bộ ca đạt

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-model-may-sang-haiku-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-23T00:45:32Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-model-may-sang-haiku-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r2
  exit_code: 0
  verified_at: 2026-11-23T00:45:32Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-model-may-sang-haiku-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-23T00:45:32Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-model-may-sang-haiku-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r2
  exit_code: 0
  verified_at: 2026-11-23T00:45:32Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh cả trên HEAD lẫn baseline):
- E7 (node --test pipeline/tests/vlm-anh.test.mjs): chứng minh harness, không phân biệt feature; viết lại để assert hành vi mới hoặc xác nhận là regression-guard có chủ ý.
- E9a (cd agent && npm test): regression-guard thường.

Baseline không đo:
- bash db/db-thu.sh oneinvest_suite_mh1 --chay node _acceptance/model-may-sang-haiku/probes/khong-goi-8000.mjs: bo qua baseline: tep _acceptance/model-may-sang-haiku/probes/khong-goi-8000.mjs co o cay dang kiem nhung chua co o merge-base f2b97d28aa3ff5a175fab891d2e2b10884790cff — eval moi, chay tren code cu khong phan biet gi
- cd agent && node --import tsx --test tests/model-agent.test.ts: bo qua baseline: tep agent/tests/model-agent.test.ts co o cay dang kiem nhung chua co o merge-base f2b97d28aa3ff5a175fab891d2e2b10884790cff — eval moi, chay tren code cu khong phan biet gi
- cd agent && node --import tsx --test tests/duong-goi-agent.test.ts: bo qua baseline: tep agent/tests/duong-goi-agent.test.ts co o cay dang kiem nhung chua co o merge-base f2b97d28aa3ff5a175fab891d2e2b10884790cff — eval moi, chay tren code cu khong phan biet gi
- cd agent && bash ../db/db-thu.sh oneinvest_suite_mh1g --chay node --import tsx --test --test-concurrency=1 tests/du-lieu-gui-agent.itest.ts: bo qua baseline: tep agent/tests/du-lieu-gui-agent.itest.ts co o cay dang kiem nhung chua co o merge-base f2b97d28aa3ff5a175fab891d2e2b10884790cff — eval moi, chay tren code cu khong phan biet gi
- cd agent && bash ../db/db-thu.sh oneinvest_suite_mh1t --chay node --import tsx --test --test-concurrency=1 tests/tran-tien-agent.itest.ts: bo qua baseline: tep agent/tests/tran-tien-agent.itest.ts co o cay dang kiem nhung chua co o merge-base f2b97d28aa3ff5a175fab891d2e2b10884790cff — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/model-may-sang-haiku/probes/do-truoc-sau.mjs --kiem: bo qua baseline: tep _acceptance/model-may-sang-haiku/probes/do-truoc-sau.mjs co o cay dang kiem nhung chua co o merge-base f2b97d28aa3ff5a175fab891d2e2b10884790cff — eval moi, chay tren code cu khong phan biet gi
- node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a': baseline vuot tran 180 giay/lenh — da dung ca cay tien trinh; BLOCKED ha tang, khong phai ket qua cua code cu
- node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b': baseline vuot tran 148 giay/lenh — da dung ca cay tien trinh; BLOCKED ha tang, khong phai ket qua cua code cu
- node --test scripts/*.test.mjs: het tran tong 480 giay cua lane baseline truoc khi toi lenh nay — khong chay

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E9a, E9d và năm lỗ đo trong hợp đồng bị từ chối — sửa phép đo AC-8 (qua hàm dựng thẻ thật), AC-4, AC-10 và khai long_running cho E9a–E9d. Returned to implementation.
Round 2: toàn bộ eval đạt, không mục chờ người phán — PASS.
