---
schema_version: 2
feature_slug: nhan-du-an-thay-khu-do-thi-ops
verdict: BLOCKED
failed_evals: []
reason: "Lenh suite-neu-doi.mjs pipeline_b (cd pipeline && npm run test:b) da duoc chuyen sang nen sau 600 giay (ID bexjgfriv), van dang chay, tep dau ra chua co dong __EXIT=. Hai lan kiem tra sau do khong thay ket qua; lenh sleep bi chan nen khong the cho dung cach. Chua co ma thoat that. Can cho them, khai long_running cho eval trong evals.yaml neu suite can hon 30 phut."
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: f5fbeaef09a6a41f1625c52b8a14bb584b386788
human_signoff:
---

# Evidence Report: nhan-du-an-thay-khu-do-thi-ops

Round 2. Verdict BLOCKED: năm eval máy đều xanh, nhưng suite hồi quy pipeline_b chưa có mã thoát thật (lệnh chuyển sang nền, không chờ được). Không có eval nào đỏ; việc cần làm là chạy lại với thời gian chờ dài hơn.

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
  verified_at: 2026-11-17T17:31:37Z
  output: |
    node --test scripts/nhan-du-an-thay-khu-do-thi.test.mjs
    ℹ duration_ms 586.865083
    __EXIT=0

- eval: E3
  run_id: minted-nhan-du-an-thay-khu-do-thi-ops-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ndt_unit
  verified_at: 2026-11-17T17:31:37Z
  output: |
    node --test scripts/nhan-du-an-thay-khu-do-thi.test.mjs
    ℹ duration_ms 586.865083
    __EXIT=0

- eval: E6
  run_id: minted-nhan-du-an-thay-khu-do-thi-ops-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ndt_unit
  verified_at: 2026-11-17T17:31:37Z
  output: |
    node --test scripts/nhan-du-an-thay-khu-do-thi.test.mjs
    ℹ duration_ms 586.865083
    __EXIT=0

- eval: E2
  run_id: minted-nhan-du-an-thay-khu-do-thi-ops-E2-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.test.app_ui
  verified_at: 2026-11-17T17:31:37Z
  output: |
    cd app && npm test
    ℹ duration_ms 864598.480208
    __EXIT=0

- eval: E5
  run_id: design-gate-786f0f7504
  exit_code: 0
  baseline: red
  verifier: config:executors.design.tb_gate
  verified_at: 2026-11-17T17:31:37Z
  output: |
    design-gate --jsdom chạy lần lượt trên do-hang-ngay.tsx, record-sheet.tsx, records-filter.tsx
    }
    __EXIT=0

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-nhan-du-an-thay-khu-do-thi-ops-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r2
  exit_code: 0
  verified_at: 2026-11-17T17:31:37Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-nhan-du-an-thay-khu-do-thi-ops-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-17T17:31:37Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-nhan-du-an-thay-khu-do-thi-ops-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r2
  exit_code: 0
  verified_at: 2026-11-17T17:31:37Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-nhan-du-an-thay-khu-do-thi-ops-SUITE-test_a-r2
  exit_code: 0
  verified_at: 2026-11-17T17:31:37Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-nhan-du-an-thay-khu-do-thi-ops-SUITE-test_b-r2
  trạng thái: không chạy xong (cannot-run), chưa có mã thoát thật; lệnh còn chạy nền (ID bexjgfriv), tệp đầu ra chưa có dòng kết thúc
  verified_at: 2026-11-17T17:31:37Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-nhan-du-an-thay-khu-do-thi-ops-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-17T17:31:37Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-nhan-du-an-thay-khu-do-thi-ops-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r2
  exit_code: 0
  verified_at: 2026-11-17T17:31:37Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đo được baseline đều red trên baseline (có phân biệt): E2 và E5 là red.

Baseline không đo
- node --test scripts/nhan-du-an-thay-khu-do-thi.test.mjs: bo qua baseline: tep scripts/nhan-du-an-thay-khu-do-thi.test.mjs co o cay dang kiem nhung chua co o merge-base 98fe528b122c950afd3a418e36c9fd677f09d504 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: không có dữ liệu trong đầu vào của round này; lịch sử round cũ nằm ở bản trước.
Round 2: năm eval máy (E1, E2, E3, E5, E6) xanh; suite pipeline_b chưa có kết quả thật (lệnh chạy nền quá 600 giây, không chờ được) nên verdict BLOCKED. Cần chạy lại pipeline_b với thời gian chờ dài hơn hoặc khai long_running trong evals.yaml.

