---
schema_version: 2
feature_slug: kiem-do-sau-ap-070-sua
verdict: BLOCKED
failed_evals: []
reason: "Lệnh `cd pipeline && npm test` (worktree sdt-s06-danh-ba) chạy quá 30 phút mà chưa xong, chưa in dòng kết thúc. Tiến trình npm test (pid 13943, khởi động khoảng 15:01) vẫn đang chạy lúc 15:31; các suite con còn chạy (scripts/gan-sdt-s06, kiem-do-sau-070, luoc-do-rieng, reassign-areas, so-ghep-s06, test-posts, tin-rao-gan-khu-vuc, transform-zalo-loai-tin-doi-chieu, write-offers, ops-facts-so-tong-hop). Không phải do công cụ giết: lệnh được chuyển nền và vẫn chạy. Không có kết quả xanh hay đỏ để kết luận. Cần khai long_running cho eval npm test trong evals.yaml (hoặc kiểm tra treo ở suite nào) trước khi chạy lại."
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 1b6d0aff353030c5ff87ba9b478b2632bd1e35dc
human_signoff:
---

# Evidence Report: kiem-do-sau-ap-070-sua

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |

Tổng kết vòng 1: cả năm eval của tính năng đều xanh, nhưng lệnh suite `cd pipeline && npm test` chưa kết thúc sau hơn 30 phút nên vòng này BLOCKED (không phải lỗi mã, xem `reason`).

## Evidence

- eval: E1
  run_id: minted-kiem-do-sau-ap-070-sua-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.kd_test
  verified_at: 2026-11-03T07:58:16Z
  output: |
    (lệnh: node --test pipeline/scripts/kiem-do-sau-070.test.mjs)
    ℹ duration_ms 888.267458

    __EXIT=0

- eval: E2
  run_id: minted-kiem-do-sau-ap-070-sua-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.kd_test
  verified_at: 2026-11-03T07:58:16Z
  output: |
    (lệnh: node --test pipeline/scripts/kiem-do-sau-070.test.mjs)
    ℹ duration_ms 888.267458

    __EXIT=0

- eval: E3
  run_id: minted-kiem-do-sau-ap-070-sua-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.kd_test
  verified_at: 2026-11-03T07:58:16Z
  output: |
    (lệnh: node --test pipeline/scripts/kiem-do-sau-070.test.mjs)
    ℹ duration_ms 888.267458

    __EXIT=0

- eval: E4
  run_id: minted-kiem-do-sau-ap-070-sua-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.kd_that
  verified_at: 2026-11-03T07:58:16Z
  output: |
    (lệnh: node _acceptance/kiem-do-sau-ap-070-sua/probes/doi-chieu-that.mjs)
    doi-chieu-that: đạt

    __EXIT=0

- eval: E5
  run_id: minted-kiem-do-sau-ap-070-sua-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.kd_that
  verified_at: 2026-11-03T07:58:16Z
  output: |
    (lệnh: node _acceptance/kiem-do-sau-ap-070-sua/probes/doi-chieu-that.mjs)
    doi-chieu-that: đạt

    __EXIT=0

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-kiem-do-sau-ap-070-sua-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-03T07:58:16Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-kiem-do-sau-ap-070-sua-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-03T07:58:16Z

- cmd: cd app && npm test
  run_id: minted-kiem-do-sau-ap-070-sua-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-11-03T07:58:16Z

- cmd: cd pipeline && npm test
  run_id: minted-kiem-do-sau-ap-070-sua-SUITE-npm_test__13563d-r1
  exit_code: n-a (BLOCKED, lệnh chưa kết thúc, chưa có dòng kết thúc nào)
  verified_at: 2026-11-03T07:58:16Z
  ghi_chú: tiến trình pid 13943 vẫn chạy lúc 15:31, tệp đầu ra nền rỗng (0 byte); không có kết quả xanh hay đỏ

- cmd: cd app && npm run test:lint-rules
  run_id: minted-kiem-do-sau-ap-070-sua-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-03T07:58:16Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-kiem-do-sau-ap-070-sua-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-03T07:58:16Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «This session is isolated in the worktree /Users/manhphan/dev/onehub-invest/.claude/worktrees/sdt-s06-danh-ba, but this command is too complex to verify that it stays inside the worktree. Refusing to run it — a worktree-isolated session's gi»

Vì baseline không chạy, danh sách eval không-phân-biệt (xanh cả trên mã cũ lẫn mã mới) KHÔNG đo được ở vòng này. Mọi field baseline đều là n-a.

Baseline khong do:
- node --test pipeline/scripts/kiem-do-sau-070.test.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «This session is isolated in the worktree /Users/manhphan/dev/onehub-invest/.claude/worktrees/sdt-s06-danh-ba, but this command is too complex to verify that it stays inside the worktree. Refusing to run it — a worktree-isolated session's gi»
- node _acceptance/kiem-do-sau-ap-070-sua/probes/doi-chieu-that.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «This session is isolated in the worktree /Users/manhphan/dev/onehub-invest/.claude/worktrees/sdt-s06-danh-ba, but this command is too complex to verify that it stays inside the worktree. Refusing to run it — a worktree-isolated session's gi»

Không có judgment eval trong hợp đồng này (E1 đến E5 đều là test hoặc script), nên không có hội đồng chấm và không có mục cần human_override.

Phát hiện của vòng rà soát (hai mục trong hợp đồng thuộc AC-4, bảy mục ngoài hợp đồng) nằm ở `review-findings.md`, không lặp lại ở đây. Lệnh không gắn eval mà lỗi: không có.

## Variance

none — mọi eval nhiều lần chạy đều đồng đều (cả năm eval chạy một lần, tất định).

## Iterations

Round 1: BLOCKED — E1 đến E5 xanh, năm lệnh suite xanh, riêng `cd pipeline && npm test` chạy quá 30 phút chưa kết thúc (không phải lỗi mã); cần khai long_running cho lệnh này trong evals.yaml hoặc tìm suite treo rồi chạy lại.
