---
schema_version: 2
feature_slug: dong-du-lieu-that-neu-lan-do-moi-nhat
verdict: BLOCKED
failed_evals: []
reason: "Lệnh `node scripts/suite-neu-doi.mjs pipeline_that -- 'cd pipeline && npm run test:that'` chạy quá 30 phút chưa xong (tệp đầu ra còn rỗng, chưa có dòng kết thúc). Eval pipeline_that không khai long_running trong evals.yaml nên trần mặc định 30 phút áp dụng. Lệnh vẫn chạy nền, công cụ chưa giết nó. Chưa kết luận xanh hay đỏ. Cách gỡ: khai long_running cho pipeline_that trong evals.yaml rồi chạy lại. Ngoài ra lệnh suite app_ui đỏ ở round này, không gắn eval nào (xem Evidence)."
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: eb679177ac51eb11be006b62e321f72b1ba13467
human_signoff:
---

# Evidence Report: dong-du-lieu-that-neu-lan-do-moi-nhat

Round 2. Verdict BLOCKED: một lệnh suite (pipeline_that) chưa chạy xong trong trần 30 phút; chưa kết luận xanh hay đỏ cho lệnh đó. Bốn eval của hợp đồng (E1-E4) đều đạt.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-dong-du-lieu-that-neu-lan-do-moi-nhat-E1-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.ht30_dong
  verified_at: 2026-11-26T05:46:07Z
  output: |
    lệnh: node --test --test-concurrency=1 scripts/pipeline-that-hang-ngay.test.mjs
    ℹ duration_ms 1258.18575

- eval: E2
  run_id: minted-dong-du-lieu-that-neu-lan-do-moi-nhat-E2-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.ht30_dong
  verified_at: 2026-11-26T05:46:07Z
  output: |
    lệnh: node --test --test-concurrency=1 scripts/pipeline-that-hang-ngay.test.mjs
    ℹ duration_ms 1258.18575

- eval: E3
  run_id: minted-dong-du-lieu-that-neu-lan-do-moi-nhat-E3-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.ht30_dong
  verified_at: 2026-11-26T05:46:07Z
  output: |
    lệnh: node --test --test-concurrency=1 scripts/pipeline-that-hang-ngay.test.mjs
    ℹ duration_ms 1258.18575

- eval: E4
  run_id: minted-dong-du-lieu-that-neu-lan-do-moi-nhat-E4-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.ht30_dong
  verified_at: 2026-11-26T05:46:07Z
  output: |
    lệnh: node --test --test-concurrency=1 scripts/pipeline-that-hang-ngay.test.mjs
    ℹ duration_ms 1258.18575

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-dong-du-lieu-that-neu-lan-do-moi-nhat-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r2
  exit_code: 0
  verified_at: 2026-11-26T05:46:07Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-dong-du-lieu-that-neu-lan-do-moi-nhat-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-26T05:46:07Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-dong-du-lieu-that-neu-lan-do-moi-nhat-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r2
  ket_qua: đỏ (lệnh thoát khác không; không gắn eval nào, nên không vào danh sách failed_evals)
  verified_at: 2026-11-26T05:46:07Z
  ghi_chu: các ca đỏ in ra là lỗi nạp mô-đun, thiếu gói `pg` khi data-api được nạp từ cây worktree (các ca CG9-AC-7 /v1/deals, /api/v1/deals). Không thuộc ca HT30 nào. Cần người xem nền có đỏ sẵn trước feature hay không.

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-dong-du-lieu-that-neu-lan-do-moi-nhat-SUITE-test_a-r2
  exit_code: 0
  verified_at: 2026-11-26T05:46:07Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-dong-du-lieu-that-neu-lan-do-moi-nhat-SUITE-test_b-r2
  exit_code: 0
  verified_at: 2026-11-26T05:46:07Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_that -- 'cd pipeline && npm run test:that'
  run_id: bzq3w23nh
  ket_qua: chưa kết luận. Lệnh chạy quá 30 phút (trần mặc định vì eval không khai long_running), bị đẩy sang nền, tệp đầu ra còn rỗng, chưa có dòng kết thúc. Công cụ chưa giết lệnh. Không có mã thoát thật để báo.
  verified_at: 2026-11-26T05:46:07Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-dong-du-lieu-that-neu-lan-do-moi-nhat-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-26T05:46:07Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-dong-du-lieu-that-neu-lan-do-moi-nhat-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r2
  exit_code: 0
  verified_at: 2026-11-26T05:46:07Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh trên cả HEAD lẫn baseline; chứng minh harness chứ chưa chứng minh feature; nên viết lại để assert hành vi mới hoặc xác nhận là regression-guard có chủ ý):

- `node --test --test-concurrency=1 scripts/pipeline-that-hang-ngay.test.mjs` phủ E1, E2, E3, E4.

Lệnh suite xanh cả hai phía là regression-guard bình thường, không liệt kê.

## Variance

none — mọi eval chạy một lần, xác định (không có eval nhiều lượt chạy).

## Iterations

Round 1: chấm M5 vòng 1 nêu 7 mục ngoài hợp đồng quanh AC-4 (đọc sổ theo đường tương đối với cwd, phần «lệnh thật ngoài kho» luôn đậu); AC-4 được thu hẹp về đo ở mức hàm. Trả về cho phần cài đặt.
Round 2: E1-E4 đạt, nhưng BLOCKED vì lệnh suite pipeline_that chạy quá 30 phút chưa xong (cần khai long_running rồi chạy lại); suite app_ui đỏ, không gắn eval nào.

máy: M5 (M5 Max 18 nhân, colima 16/96) · DB: `oneinvest` đầy đủ của M5 (bản chép DB máy thu 26/11; db-thu chép từ đó, không dựng DB trống) · ca đỏ có tên: app_ui CG9-AC-7 (/v1/deals data-api, /api/v1/deals app) — thiếu gói `pg` vì worktree chấm chưa gắn data-api/node_modules (lỗi dựng chỗ chấm); pipeline_that quá trần chờ 30′, chưa kết luận.
