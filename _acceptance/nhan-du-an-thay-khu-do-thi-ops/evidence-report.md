---
schema_version: 2
feature_slug: nhan-du-an-thay-khu-do-thi-ops
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: bdcc868e19b3da484997b682e71432520eef5d26
human_signoff:
---

# Evidence Report: nhan-du-an-thay-khu-do-thi-ops

Round 2. Cả năm eval của tính năng đều xanh. Verdict REJECT vì có một lệnh suite hồi quy không gắn eval nào (`app`: tsc + lint) thoát với mã khác 0, nên hồ sơ không được coi là sạch. Chi tiết nằm ở mục «Lệnh suite (hồi quy)» bên dưới.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E5 | AC-2 | script | PASS |
| E6 | AC-2 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-nhan-du-an-thay-khu-do-thi-ops-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ndt_unit
  verified_at: 2026-11-17T18:13:00Z
  output: |
    node --test scripts/nhan-du-an-thay-khu-do-thi.test.mjs
    duration_ms 468.662375

- eval: E2
  run_id: minted-nhan-du-an-thay-khu-do-thi-ops-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-11-17T18:13:00Z
  output: |
    cd app && npm test
    duration_ms 670821.185834

- eval: E3
  run_id: minted-nhan-du-an-thay-khu-do-thi-ops-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ndt_unit
  verified_at: 2026-11-17T18:13:00Z
  output: |
    node --test scripts/nhan-du-an-thay-khu-do-thi.test.mjs
    duration_ms 468.662375

- eval: E5
  run_id: minted-nhan-du-an-thay-khu-do-thi-ops-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.tb_gate
  verified_at: 2026-11-17T18:13:00Z
  output: |
    design-gate --jsdom chạy lần lượt trên do-hang-ngay.tsx, record-sheet.tsx, records-filter.tsx
    mã chạy gate: design-gate-84c344cc05, design-gate-7fc085b8d0

- eval: E6
  run_id: minted-nhan-du-an-thay-khu-do-thi-ops-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ndt_unit
  verified_at: 2026-11-17T18:13:00Z
  output: |
    node --test scripts/nhan-du-an-thay-khu-do-thi.test.mjs
    duration_ms 468.662375

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-nhan-du-an-thay-khu-do-thi-ops-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r2
  exit_code: 0
  verified_at: 2026-11-17T18:13:00Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-nhan-du-an-thay-khu-do-thi-ops-SUITE-lint-r2
  exit_code: 2
  verified_at: 2026-11-17T18:13:00Z
  output: |
    suite-neu-doi: chạy app (đổi CONTEXT.md, +60 tệp trong vùng)
    bước lint: eslint dừng giữa chừng, ESLint 9.39.5 báo ENOENT khi mở
    app/tests/.od2-cu-22265-0.ts (tệp tạm biến mất giữa lúc eslint liệt kê và lúc đọc)
    Lệnh này không gắn eval nào; lint chưa chạy xong nên chưa có kết luận về mã nguồn.

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-nhan-du-an-thay-khu-do-thi-ops-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r2
  exit_code: 0
  verified_at: 2026-11-17T18:13:00Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-nhan-du-an-thay-khu-do-thi-ops-SUITE-test_a-r2
  exit_code: 0
  verified_at: 2026-11-17T18:13:00Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-nhan-du-an-thay-khu-do-thi-ops-SUITE-test_b-r2
  exit_code: 0
  verified_at: 2026-11-17T18:13:00Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-nhan-du-an-thay-khu-do-thi-ops-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-17T18:13:00Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-nhan-du-an-thay-khu-do-thi-ops-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r2
  exit_code: 0
  verified_at: 2026-11-17T18:13:00Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 2 — baseline khong do lai round nay (evals.yaml khong doi tu lan baseline cuoi). Mọi block eval ghi `baseline: n-a`.

Eval không-phân-biệt: không có. Các lệnh suite xanh là regression-guard thông thường nên không liệt kê.

Lệnh fail không gắn eval: `node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'` thoát mã 2 (ESLint ENOENT trên tệp tạm app/tests/.od2-cu-22265-0.ts). Không eval nào phủ lệnh này; đây là lý do duy nhất của verdict REJECT. Các suite còn lại, gồm cả `app_ui` (npm test của app) và `ui_lint_rules`, đều xanh.

Judge panel: không có judgment item nào trong round này, không panel nào cần de xuat.

## Variance

none — mọi eval chạy một lần (deterministic), không có pass_rate hỗn hợp.

## Iterations

Round trước: BLOCKED — suite pipeline_b chưa có mã thoát (theo commit bdcc868e1).
Round 2: REJECT — năm eval E1, E2, E3, E5, E6 xanh; lệnh suite `app` (tsc + lint) hỏng ở bước lint do ESLint không đọc được một tệp tạm vừa biến mất (ENOENT), chưa có kết luận về mã nguồn. Trả về triển khai/chạy lại để lint hoàn tất.

