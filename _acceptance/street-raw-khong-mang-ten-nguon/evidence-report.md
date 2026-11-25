---
schema_version: 2
feature_slug: street-raw-khong-mang-ten-nguon
verdict: BLOCKED
failed_evals: []
reason: |
  Hai lệnh bị công cụ Bash từ chối trước khi chạy (kiểm tra cô lập worktree không xác minh được cú pháp), nên E1, E2, E3, E5 và E7 chưa có kết quả đo; đây là chặn của công cụ, không phải lỗi mã.
  - cmd: bash _acceptance/street-raw-khong-mang-ten-nguon/probes/ban-chep.sh (E1, E2, E3, E5) — Công cụ Bash từ chối chạy lệnh khởi chạy (bước 1) vì kiểm tra cô lập worktree không xác minh được cú pháp; lệnh phải được chép nguyên văn nên không tách ra được. Tệp ban-chep.sh có tồn tại, nên nguyên nhân là chặn của công cụ, không phải thiếu script. Cần người chạy lại lệnh ngoài công cụ hoặc cấp lối chạy khác.
  - cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b' (E7) — Công cụ Bash từ chối lệnh khởi chạy (kiểm tra cô lập worktree coi cấu trúc cd lồng trong lệnh là không kiểm chứng được), nên lệnh pipeline_b không bao giờ chạy. Không viết lại lệnh để lách kiểm tra này: việc tách lệnh sẽ làm mất ngữ nghĩa chờ/ghi mã thoát của bước khởi chạy nền. Cần người điều phối chạy đúng lệnh đã ghim, hoặc cho phép dạng lệnh này trong phiên worktree. Thời lượng khai báo long_running là 90 phút.
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: ca962f33adae04c894b8c19f57534a45f1ae2530
human_signoff:
---

# Evidence Report: street-raw-khong-mang-ten-nguon

Round 2. Verdict BLOCKED: lệnh bản chép (E1, E2, E3, E5) và nửa B (E7) bị công cụ từ chối khởi chạy; cần chạy lại ngoài công cụ.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | BLOCKED |
| E2 | AC-2 | script | BLOCKED |
| E3 | AC-3 | script | BLOCKED |
| E4 | AC-4 | test | PASS (carry-forward từ round 1) |
| E5 | AC-5 | script | BLOCKED |
| E6 | AC-4 | script | PASS |
| E7 | AC-4 | script | BLOCKED |

## Evidence

- eval: E1
  run_id: minted-street-raw-khong-mang-ten-nguon-E1-r2
  baseline: n-a
  verifier: bash _acceptance/street-raw-khong-mang-ten-nguon/probes/ban-chep.sh
  status: BLOCKED (công cụ từ chối lệnh khởi chạy, không có nhật ký, không có dòng mã thoát; không đo PASS hay FAIL)
  output: |
    Bước 1 (khởi chạy nền, run_in_background=true, timeout 600000) bị công cụ Bash từ chối trước khi chạy: kiểm tra cô lập worktree coi lệnh là quá phức tạp để xác minh. Tệp probes/ban-chep.sh tồn tại (308 byte).

- eval: E2
  run_id: minted-street-raw-khong-mang-ten-nguon-E2-r2
  baseline: n-a
  verifier: bash _acceptance/street-raw-khong-mang-ten-nguon/probes/ban-chep.sh
  status: BLOCKED (cùng lệnh với E1, chưa chạy)

- eval: E3
  run_id: minted-street-raw-khong-mang-ten-nguon-E3-r2
  baseline: n-a
  verifier: bash _acceptance/street-raw-khong-mang-ten-nguon/probes/ban-chep.sh
  status: BLOCKED (cùng lệnh với E1, chưa chạy)

- eval: E5
  run_id: minted-street-raw-khong-mang-ten-nguon-E5-r2
  baseline: n-a
  verifier: bash _acceptance/street-raw-khong-mang-ten-nguon/probes/ban-chep.sh
  status: BLOCKED (cùng lệnh với E1, chưa chạy)

- eval: E6
  run_id: minted-street-raw-khong-mang-ten-nguon-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.suite.pipeline_a
  output: |
    ℹ duration_ms 2586582.740167
    __EXIT=0

- eval: E7
  run_id: minted-street-raw-khong-mang-ten-nguon-E7-r2
  baseline: n-a
  verifier: config:executors.suite.pipeline_b
  status: BLOCKED (lệnh pipeline_b không bao giờ chạy; không có nhật ký, không có tiến trình)
  output: |
    Bước 1 (khởi chạy nền) bị công cụ từ chối trước khi chạy; cấu trúc cd lồng trong lệnh bị coi là không kiểm chứng được. Không chạy bước chờ vì không có tiến trình.

- eval: E4
  run_id: minted-street-raw-khong-mang-ten-nguon-E4-r1
  exit_code: 0
  verifier: config:executors.test
  verified_at: 2026-11-25T13:13:58Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-street-raw-khong-mang-ten-nguon-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r2
  exit_code: 0

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-street-raw-khong-mang-ten-nguon-SUITE-lint-r2
  exit_code: 0

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-street-raw-khong-mang-ten-nguon-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r2
  exit_code: 0

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-street-raw-khong-mang-ten-nguon-SUITE-test_lint_rules-r2
  exit_code: 0

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-street-raw-khong-mang-ten-nguon-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r2
  exit_code: 0

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «This session is isolated in the worktree /Users/manhphan/dev/onehub-invest/.claude/worktrees/street-raw-khong-mang-ten-nguon, but this command is too complex to verify that it stays inside the worktree. Refusing to run it — a worktree-isola»

Eval không-phân-biệt: không đo được ở round này (baseline bị chặn hạ tầng).

Baseline khong do:
- bash _acceptance/street-raw-khong-mang-ten-nguon/probes/ban-chep.sh: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «This session is isolated in the worktree /Users/manhphan/dev/onehub-invest/.claude/worktrees/street-raw-khong-mang-ten-nguon, but this command is too complex to verify that it stays inside the worktree. Refusing to run it — a worktree-isola»
- node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a': BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «This session is isolated in the worktree /Users/manhphan/dev/onehub-invest/.claude/worktrees/street-raw-khong-mang-ten-nguon, but this command is too complex to verify that it stays inside the worktree. Refusing to run it — a worktree-isola»
- node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b': BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «This session is isolated in the worktree /Users/manhphan/dev/onehub-invest/.claude/worktrees/street-raw-khong-mang-ten-nguon, but this command is too complex to verify that it stays inside the worktree. Refusing to run it — a worktree-isola»

## Variance

none — không có eval nhiều lượt chạy; mọi eval deterministic.

## Iterations

Round 1: E4 xanh (giữ lại ở round 2 bằng carry-forward).
Round 2: BLOCKED hạ tầng — công cụ Bash từ chối khởi chạy lệnh bản chép (E1, E2, E3, E5) và nửa B (E7); E6 và các lệnh suite xanh. Cần chạy lại hai lệnh đó ngoài công cụ rồi verify lại.

