---
schema_version: 2
feature_slug: model-may-sang-haiku
verdict: REJECT
failed_evals: ["E9a","E9d"]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 66f9f478ef6dc4a90bc8697a8728b8b2ce4322ef
human_signoff:
---

# Evidence Report: model-may-sang-haiku

Round 1. Hai eval hồi quy E9a và E9d không đạt; một lệnh suite không gắn eval (app_ui) cũng không đạt. Chi tiết ở các khối dưới.

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
| E10 | AC-10 | script | PASS |
| E9a | AC-9 | test | FAIL |
| E9b | AC-9 | test | PASS |
| E9c | AC-9 | test | PASS |
| E9d | AC-9 | test | FAIL |

## Evidence

- eval: E1
  run_id: minted-model-may-sang-haiku-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/model-may-sang-haiku/probes/khong-goi-8000.mjs
  verified_at: 2026-11-22T10:20:23Z
  output: |
    AC-1 ĐẠT: 0 lời gọi MTPLX, mỗi lệnh gọi model cloud (enrich-run, judge-run, smoke đi Anthropic thẳng), mã sản xuất sạch

- eval: E2
  run_id: minted-model-may-sang-haiku-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: agent/tests/model-agent.test.ts
  verified_at: 2026-11-22T10:20:23Z
  output: |
    cd agent && node --import tsx --test tests/model-agent.test.ts đạt (chung lệnh với E3, E6)

- eval: E2b
  run_id: minted-model-may-sang-haiku-E2b-r1
  exit_code: 0
  baseline: n-a
  verifier: agent/tests/duong-goi-agent.test.ts
  verified_at: 2026-11-22T10:20:23Z
  output: |
    cd agent && node --import tsx --test tests/duong-goi-agent.test.ts đạt

- eval: E3
  run_id: minted-model-may-sang-haiku-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: agent/tests/model-agent.test.ts
  verified_at: 2026-11-22T10:20:23Z
  output: |
    cùng lệnh với E2, đạt

- eval: E4
  run_id: r1-l4-1-20261122102023
  exit_code: 0
  baseline: n-a
  verifier: agent/tests/du-lieu-gui-agent.itest.ts
  verified_at: 2026-11-22T10:20:23Z
  output: |
    bash ../db/db-thu.sh oneinvest_suite_mh1g --chay node --import tsx --test --test-concurrency=1 tests/du-lieu-gui-agent.itest.ts đạt

- eval: E5
  run_id: minted-model-may-sang-haiku-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: agent/tests/tran-tien-agent.itest.ts
  verified_at: 2026-11-22T10:20:23Z
  output: |
    bash ../db/db-thu.sh oneinvest_suite_mh1t --chay ... tests/tran-tien-agent.itest.ts đạt (chung lệnh với E10)

- eval: E6
  run_id: minted-model-may-sang-haiku-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: agent/tests/model-agent.test.ts
  verified_at: 2026-11-22T10:20:23Z
  output: |
    cùng lệnh với E2, đạt

- eval: E7
  run_id: minted-model-may-sang-haiku-E7-r1
  exit_code: 0
  baseline: green
  verifier: pipeline/tests/vlm-anh.test.mjs
  verified_at: 2026-11-22T10:20:23Z
  output: |
    node --test pipeline/tests/vlm-anh.test.mjs đạt

- eval: E8
  run_id: minted-model-may-sang-haiku-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/model-may-sang-haiku/probes/do-truoc-sau.mjs
  verified_at: 2026-11-22T10:20:23Z
  output: |
    AC-8 ĐẠT

- eval: E10
  run_id: minted-model-may-sang-haiku-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: agent/tests/tran-tien-agent.itest.ts
  verified_at: 2026-11-22T10:20:23Z
  output: |
    cùng lệnh với E5, đạt

- eval: E9a
  run_id: minted-model-may-sang-haiku-E9a-r1
  exit_code: 1
  baseline: green
  verifier: config:executors.suite.agent
  verified_at: 2026-11-22T10:20:23Z
  output: |
    tests 380, pass 378, fail 1, skipped 1
    failing: tests/enrich-giao-dich.test.ts, ca «EC-AC-3 ma trận LLM × ghi»
    AssertionError: đột biến không khớp chuỗi trong tong-ket.ts (voiDotBien, enrich-giao-dich.test.ts:121)
    chuỗi đột biến mong đợi: «if (d.loiGhi.length > 0) return 2;» liền «if (d.llmGoi > 0 && 2 * hong(d) >= d.llmGoi) return 3;»

- eval: E9b
  run_id: minted-model-may-sang-haiku-E9b-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.suite.pipeline_a
  verified_at: 2026-11-22T10:20:23Z
  output: |
    cd pipeline && npm run test:a đạt

- eval: E9c
  run_id: minted-model-may-sang-haiku-E9c-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.suite.pipeline_b
  verified_at: 2026-11-22T10:20:23Z
  output: |
    cd pipeline && npm run test:b đạt

- eval: E9d
  run_id: minted-model-may-sang-haiku-E9d-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.test.scripts
  verified_at: 2026-11-22T10:20:23Z
  output: |
    node --test scripts/*.test.mjs: ca kiem-tin-rao-gan-khu-vuc.test.mjs đỏ
    kiem-tin-rao-gan: FAIL (1)
    assert strictEqual actual 1, expected 0 (scripts/kiem-tin-rao-gan-khu-vuc.test.mjs:33)
    nhật ký chạy nêu «gán SĐT S06: CHUA-AP-068 — hàm phân xử chưa giữ khoá seller_phone, lượt này không ghi»

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-model-may-sang-haiku-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-22T10:20:23Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-model-may-sang-haiku-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r1
  exit_code: 1
  verified_at: 2026-11-22T10:20:23Z
  note: lệnh không gắn eval nào. Hai ca CG9-AC-7 trong tests/hang-gia-doc.test.tsx đỏ vì «Cannot find package 'pg'» khi nạp data-api/src/db/client.ts từ worktree (ERR_MODULE_NOT_FOUND). Trông như lỗi môi trường worktree thiếu node_modules của data-api, chưa phân biệt được với lỗi mã.

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-model-may-sang-haiku-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-22T10:20:23Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-model-may-sang-haiku-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r1
  exit_code: 0
  verified_at: 2026-11-22T10:20:23Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (đạt cả trên HEAD lẫn baseline):
- E7 (node --test pipeline/tests/vlm-anh.test.mjs): baseline green. Cần viết lại để khẳng định hành vi mới hoặc xác nhận là regression-guard có chủ ý.

Baseline khong do:
- bash db/db-thu.sh oneinvest_suite_mh1 --chay node _acceptance/model-may-sang-haiku/probes/khong-goi-8000.mjs: bo qua baseline: tep _acceptance/model-may-sang-haiku/probes/khong-goi-8000.mjs co o cay dang kiem nhung chua co o merge-base f962afade8ce5122a9f0b5975dba28db7c31eeb1 — eval moi, chay tren code cu khong phan biet gi
- cd agent && node --import tsx --test tests/model-agent.test.ts: bo qua baseline: tep agent/tests/model-agent.test.ts co o cay dang kiem nhung chua co o merge-base f962afade8ce5122a9f0b5975dba28db7c31eeb1 — eval moi, chay tren code cu khong phan biet gi
- cd agent && node --import tsx --test tests/duong-goi-agent.test.ts: bo qua baseline: tep agent/tests/duong-goi-agent.test.ts co o cay dang kiem nhung chua co o merge-base f962afade8ce5122a9f0b5975dba28db7c31eeb1 — eval moi, chay tren code cu khong phan biet gi
- cd agent && bash ../db/db-thu.sh oneinvest_suite_mh1g --chay node --import tsx --test --test-concurrency=1 tests/du-lieu-gui-agent.itest.ts: bo qua baseline: tep agent/tests/du-lieu-gui-agent.itest.ts co o cay dang kiem nhung chua co o merge-base f962afade8ce5122a9f0b5975dba28db7c31eeb1 — eval moi, chay tren code cu khong phan biet gi
- cd agent && bash ../db/db-thu.sh oneinvest_suite_mh1t --chay node --import tsx --test --test-concurrency=1 tests/tran-tien-agent.itest.ts: bo qua baseline: tep agent/tests/tran-tien-agent.itest.ts co o cay dang kiem nhung chua co o merge-base f962afade8ce5122a9f0b5975dba28db7c31eeb1 — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/model-may-sang-haiku/probes/do-truoc-sau.mjs --kiem: bo qua baseline: tep _acceptance/model-may-sang-haiku/probes/do-truoc-sau.mjs co o cay dang kiem nhung chua co o merge-base f962afade8ce5122a9f0b5975dba28db7c31eeb1 — eval moi, chay tren code cu khong phan biet gi
- node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a': baseline vuot tran 180 giay/lenh — da dung ca cay tien trinh; BLOCKED ha tang, khong phai ket qua cua code cu
- node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b': baseline vuot tran 132 giay/lenh — da dung ca cay tien trinh; BLOCKED ha tang, khong phai ket qua cua code cu
- node --test scripts/*.test.mjs: het tran tong 480 giay cua lane baseline truoc khi toi lenh nay — khong chay

## Variance

none — mọi eval chạy một lần, kết quả đồng nhất (không có runs lớn hơn 1).

## Iterations

Round 1: E9a và E9d không đạt. E9a: ca EC-AC-3 trong agent/tests/enrich-giao-dich.test.ts không khớp chuỗi đột biến trong tong-ket.ts (test gắn với dòng mã tổng kết đã đổi). E9d: scripts/kiem-tin-rao-gan-khu-vuc.test.mjs đỏ (nhật ký nêu CHUA-AP-068 chưa áp trên DB thử). Lệnh suite app_ui cũng đỏ vì thiếu gói pg trong worktree. Trả về giai đoạn triển khai.
