---
schema_version: 2
feature_slug: lat-hai-khu-truc-khai-o
verdict: BLOCKED
failed_evals: []
reason: "Lệnh `node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'` chạy quá 30 phút (mặc định cho eval không khai long_running) mà chưa xong, không có dòng kết thúc __EXIT=. Không xác định được evals.yaml có khai long_running cho pipeline_a không, nên chưa rõ trần đúng. Không sửa code, không đổi branch, không chạy lại. Tiến trình nền chưa được dừng. Cần kiểm tra lại suite pipeline_a hoặc khai long_running trong evals.yaml rồi chạy lại."
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: a0d79883fb369d62f57332c38a8f5b20d15fe739
human_signoff:
---

# Evidence Report: lat-hai-khu-truc-khai-o

Vòng 1. Verdict BLOCKED: một lệnh suite hồi quy (pipeline_a) không chạy xong trong giới hạn thời gian, nên không đủ cơ sở kết luận PASS. Bốn eval của tính năng đều xanh.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-lat-hai-khu-truc-khai-o-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/lat-hai-khu-truc-khai-o/probes/test.sh
  verified_at: 2026-11-24T17:29:32Z
  output: |
    ℹ duration_ms 1363.12875

- eval: E2
  run_id: minted-lat-hai-khu-truc-khai-o-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/lat-hai-khu-truc-khai-o/probes/test.sh
  verified_at: 2026-11-24T17:29:32Z
  output: |
    ℹ duration_ms 1363.12875

- eval: E4
  run_id: minted-lat-hai-khu-truc-khai-o-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/lat-hai-khu-truc-khai-o/probes/test.sh
  verified_at: 2026-11-24T17:29:32Z
  output: |
    ℹ duration_ms 1363.12875

- eval: E3
  run_id: minted-lat-hai-khu-truc-khai-o-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/lat-hai-khu-truc-khai-o/probes/chi-them-mot-dong.sh
  verified_at: 2026-11-24T17:29:32Z
  output: |
    XANH: chỉ thêm hai-khu-truc, lát cũ giữ nguyên

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-lat-hai-khu-truc-khai-o-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r1
  exit_code: 0
  verified_at: 2026-11-24T17:29:32Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-lat-hai-khu-truc-khai-o-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-24T17:29:32Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-lat-hai-khu-truc-khai-o-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r1
  exit_code: 0
  verified_at: 2026-11-24T17:29:32Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-lat-hai-khu-truc-khai-o-SUITE-test_a-r1
  trạng thái: CHƯA XONG (BLOCKED) — chạy nền hơn 30 phút, không có dòng kết thúc, đầu ra rỗng; xem reason ở frontmatter
  verified_at: 2026-11-24T17:29:32Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-lat-hai-khu-truc-khai-o-SUITE-test_b-r1
  exit_code: 0
  verified_at: 2026-11-24T17:29:32Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-lat-hai-khu-truc-khai-o-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-24T17:29:32Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-lat-hai-khu-truc-khai-o-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r1
  exit_code: 0
  verified_at: 2026-11-24T17:29:32Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — không eval nào được xác nhận xanh trên cả baseline lẫn HEAD (cả bốn eval đều là eval mới, baseline không đo).

Baseline khong do:
- bash _acceptance/lat-hai-khu-truc-khai-o/probes/test.sh: bo qua baseline: tep _acceptance/lat-hai-khu-truc-khai-o/probes/test.sh co o cay dang kiem nhung chua co o merge-base 47855904dffd12387862756b7352929e320acac9 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/lat-hai-khu-truc-khai-o/probes/chi-them-mot-dong.sh: bo qua baseline: tep _acceptance/lat-hai-khu-truc-khai-o/probes/chi-them-mot-dong.sh co o cay dang kiem nhung chua co o merge-base 47855904dffd12387862756b7352929e320acac9 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — mọi eval chạy một lần, xác định (không có eval nhiều lượt).

## Iterations

Round 1: bốn eval E1–E4 xanh; suite pipeline_a quá 30 phút không xong (mặc định cho eval không khai long_running) nên verdict BLOCKED. Cần kiểm tra suite hoặc khai long_running trong evals.yaml rồi chạy lại; không phải lỗi mã.

