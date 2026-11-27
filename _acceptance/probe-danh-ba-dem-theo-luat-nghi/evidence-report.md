---
schema_version: 2
feature_slug: probe-danh-ba-dem-theo-luat-nghi
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 9ae4a8ef74da63cbdca2089e2ccb0001c9160644
human_signoff:
---

# Evidence Report: probe-danh-ba-dem-theo-luat-nghi

Round 1. Hai eval của tính năng (E1, E2) đều xanh. Verdict tổng vẫn là REJECT vì ba lệnh suite hồi quy không gắn eval nào bị đỏ (agent, app_ui, pipeline_a). Chi tiết ở mục «Lệnh suite (hồi quy)» và «Lệnh fail không gắn eval» bên dưới.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-probe-danh-ba-dem-theo-luat-nghi-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/probe-danh-ba-dem-theo-luat-nghi/probes/doi-chieu.sh
  verified_at: 2026-11-27T20:45:10Z
  output: |
    Lệnh: bash _acceptance/probe-danh-ba-dem-theo-luat-nghi/probes/doi-chieu.sh (chạy 1 lần, đạt 1/1, không phương sai).
    Probe TDB-DC xanh trên bản chép DB máy thu, phanKhu của probe bằng phanKhu của doc.ts.

- eval: E2
  run_id: minted-probe-danh-ba-dem-theo-luat-nghi-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/probe-danh-ba-dem-theo-luat-nghi/probes/doi-chieu.sh
  verified_at: 2026-11-27T20:45:10Z
  output: |
    ca phá đỏ đúng 7 nút nghỉ

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-probe-danh-ba-dem-theo-luat-nghi-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r1
  exit_code: 1
  verified_at: 2026-11-27T20:45:10Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-probe-danh-ba-dem-theo-luat-nghi-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-27T20:45:10Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-probe-danh-ba-dem-theo-luat-nghi-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r1
  exit_code: 1
  verified_at: 2026-11-27T20:45:10Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-probe-danh-ba-dem-theo-luat-nghi-SUITE-test_a-r1
  exit_code: 1
  verified_at: 2026-11-27T20:45:10Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-probe-danh-ba-dem-theo-luat-nghi-SUITE-test_b-r1
  exit_code: 0
  verified_at: 2026-11-27T20:45:10Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_that -- 'cd pipeline && npm run test:that'
  run_id: minted-probe-danh-ba-dem-theo-luat-nghi-SUITE-test_that-r1
  exit_code: 0
  verified_at: 2026-11-27T20:45:10Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-probe-danh-ba-dem-theo-luat-nghi-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-27T20:45:10Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-probe-danh-ba-dem-theo-luat-nghi-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r1
  exit_code: 0
  verified_at: 2026-11-27T20:45:10Z

### Lệnh fail không gắn eval

Ba lệnh suite đỏ, không gắn eval nào nên `failed_evals` để rỗng:

- agent: `cd agent && npm test` — nhiều tệp test của agent báo «test failed» ngay ở dòng đầu tệp (judge-pair, judge-run, model-agent, parsers, vlm-anh-s03, vocab-enrich…).
- app_ui: `cd app && npm test` — lỗi `ERR_MODULE_NOT_FOUND`, không tìm thấy gói `pg` khi nạp `data-api/src/db/client.ts` từ worktree (ca CG9-AC-7 trong `tests/hang-gia-doc.test.tsx`).
- pipeline_a: `cd pipeline && npm run test:a` — ca GTA-AC-8 trong `scripts/goi-thang-anthropic.test.mjs` sai khẳng định (Anthropic hết tiền / khoá sai 401 không tự lùi sang Gateway như kỳ vọng).

Các lệnh này nằm ngoài bộ đo của tính năng. Người quyết ở Cổng 2 cần xem đây là lỗi môi trường worktree (thiếu `node_modules` cho `pg`) hay hồi quy thật.

## Known limits

## Ngoài hợp đồng

## Analyst

Baseline khong do:
- bash _acceptance/probe-danh-ba-dem-theo-luat-nghi/probes/doi-chieu.sh: bo qua baseline: tep _acceptance/probe-danh-ba-dem-theo-luat-nghi/probes/doi-chieu.sh co o cay dang kiem nhung chua co o merge-base dad1be620d0ebbbe14a70d41f46f0d2248ef2dfe — eval moi, chay tren code cu khong phan biet gi

Eval không phân biệt (xanh cả HEAD lẫn baseline): none — hai eval của tính năng đều có baseline n-a (eval mới), không có eval nào được đo xanh-cả-hai-phía.

## Judge panels

Không có judgment item và không có panel nào được đề xuất. Cả hai eval (E1, E2) thuộc loại script, chạy bằng máy.

## Variance

none — mọi eval nhiều lần chạy đều đồng nhất (E1, E2 chạy 1 lần, xác định).

## Iterations

Round 1: E1, E2 xanh; REJECT vì ba lệnh suite hồi quy không gắn eval (agent, app_ui, pipeline_a) đỏ. Trả về cho khâu thực hiện.
