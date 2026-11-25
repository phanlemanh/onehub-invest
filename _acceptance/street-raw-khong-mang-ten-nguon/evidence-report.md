---
schema_version: 2
feature_slug: street-raw-khong-mang-ten-nguon
verdict: BLOCKED
failed_evals: []
reason: "Lệnh pipeline_a (node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a') chạy quá 30 phút chưa xong, chưa có mã thoát. Không khai long_running cho eval của slug street-raw-khong-mang-ten-nguon nên áp trần mặc định 30 phút. Không phải do công cụ giết: lệnh đã được chuyển sang nền, không có timeout của công cụ. Tiến trình vẫn còn chạy (PID 86370, 86532, node --test PID 64960 đang tiêu CPU). Không có công cụ TaskStop trong phiên này nên không dừng được tác vụ nền; không kết luận PASS hay FAIL. Không đổi branch, không sửa code."
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: e121efb508a0ebd03a8ce28a3196eddfae66b154
human_signoff:
---

# Evidence Report: street-raw-khong-mang-ten-nguon

Round 2. Kết luận BLOCKED: năm eval tính năng (E1 đến E5) xanh, nhưng lệnh suite pipeline_a chưa ra mã thoát nên chưa thể kết luận hồi quy.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-street-raw-khong-mang-ten-nguon-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/street-raw-khong-mang-ten-nguon/probes/ban-chep.sh
  verified_at: 2026-11-25T17:28:31Z
  output: |
    KẾT QUẢ: xanh

- eval: E2
  run_id: minted-street-raw-khong-mang-ten-nguon-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/street-raw-khong-mang-ten-nguon/probes/ban-chep.sh
  verified_at: 2026-11-25T17:28:31Z
  output: |
    KẾT QUẢ: xanh

- eval: E3
  run_id: minted-street-raw-khong-mang-ten-nguon-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/street-raw-khong-mang-ten-nguon/probes/ban-chep.sh
  verified_at: 2026-11-25T17:28:31Z
  output: |
    KẾT QUẢ: xanh

- eval: E5
  run_id: minted-street-raw-khong-mang-ten-nguon-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/street-raw-khong-mang-ten-nguon/probes/ban-chep.sh
  verified_at: 2026-11-25T17:28:31Z
  output: |
    KẾT QUẢ: xanh

- eval: E4
  run_id: minted-street-raw-khong-mang-ten-nguon-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test
  verified_at: 2026-11-25T17:28:31Z
  output: |
    ℹ duration_ms 41552.020375

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-street-raw-khong-mang-ten-nguon-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r2
  exit_code: 0
  verified_at: 2026-11-25T17:28:31Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-street-raw-khong-mang-ten-nguon-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-25T17:28:31Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-street-raw-khong-mang-ten-nguon-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r2
  exit_code: 0
  verified_at: 2026-11-25T17:28:31Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-street-raw-khong-mang-ten-nguon-SUITE-test_a-r2
  verified_at: 2026-11-25T17:28:31Z
  status: BLOCKED, chưa có mã thoát (chạy quá 30 phút, tiến trình còn chạy, không phải do công cụ giết)

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-street-raw-khong-mang-ten-nguon-SUITE-test_b-r2
  exit_code: 0
  verified_at: 2026-11-25T17:28:31Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-street-raw-khong-mang-ten-nguon-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-25T17:28:31Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-street-raw-khong-mang-ten-nguon-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r2
  exit_code: 0
  verified_at: 2026-11-25T17:28:31Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «This session is isolated in the worktree /Users/manhphan/dev/onehub-invest/.claude/worktrees/street-raw-khong-mang-ten-nguon, but this command is too complex to verify that it stays inside the worktree. Refusing to run it — a worktree-isola»

Baseline khong do:
- bash _acceptance/street-raw-khong-mang-ten-nguon/probes/ban-chep.sh: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «This session is isolated in the worktree /Users/manhphan/dev/onehub-invest/.claude/worktrees/street-raw-khong-mang-ten-nguon, but this command is too complex to verify that it stays inside the worktree. Refusing to run it — a worktree-isola»
- cd pipeline && node --test tests/street-raw-ten-nguon.test.mjs scripts/ops-nhan-ma-nguon.test.mjs scripts/soat-tang-a.test.mjs scripts/ops-facts-so-tong-hop.test.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «This session is isolated in the worktree /Users/manhphan/dev/onehub-invest/.claude/worktrees/street-raw-khong-mang-ten-nguon, but this command is too complex to verify that it stays inside the worktree. Refusing to run it — a worktree-isola»

Eval không-phân-biệt: không liệt kê được ở round này vì baseline không đo; không có eval nào được xác nhận là xanh trên cả hai phía.

## Variance

none — mọi eval chạy một lần, tất định.

## Iterations

Round 1: lịch sử nằm trong run-log.jsonl của slug.
Round 2: E1 đến E5 xanh; lệnh suite pipeline_a quá 30 phút chưa có mã thoát nên BLOCKED (chạy lại với long_running dài hơn, không phải lỗi mã).

