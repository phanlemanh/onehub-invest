---
schema_version: 2
feature_slug: sdt-trong-ten-duong
verdict: BLOCKED
failed_evals: []
reason: "E5 (AC-4) chưa chạy được. Guard của worktree từ chối lệnh BƯỚC 1 (chưa chạy): lệnh yêu cầu giữ nguyên khối `( cd ... && ... ) > log 2>&1 & ... wait` nên không thể tách thành lệnh rời mà không đổi ngữ nghĩa (mất ghi nhật ký, pid và bước xoá DB oneinvest_sdt_do). Không tự ý viết lại lệnh để luôn qua guard, vì điều đó sửa lệnh mà đề bài yêu cầu chép nguyên văn. Cần người điều phối xác nhận cách chạy (ví dụ đặt lệnh vào một tệp script trong worktree rồi gọi bằng đường dẫn tuyệt đối) trước khi chạy lại. Ngoài ra lệnh suite `cd pipeline && npm test` còn đỏ một ca (GS-AC-2 của gan-sdt-s06.test.mjs, không lấy được khoá bảng field_assertions), không gắn eval nào."
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 24e1618bd7bbd73a1384e83d5842001766e57333
human_signoff:
---

# Evidence Report: sdt-trong-ten-duong

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-1 | script | PASS |
| E3 | AC-2 | script | PASS |
| E4 | AC-3 | script | PASS |
| E5 | AC-4 | script | BLOCKED |
| E6 | AC-5 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-sdt-trong-ten-duong-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sdt_doc
  verified_at: 2026-11-03T06:31:32Z
  output: |
    ℹ duration_ms 55.147333
    __EXIT=0

- eval: E2
  run_id: minted-sdt-trong-ten-duong-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.sdt_db
  verified_at: 2026-11-03T06:31:32Z
  output: |
    ℹ duration_ms 62299.828459
    db-thu: đã xoá oneinvest_sdt
    __EXIT=0

- eval: E3
  run_id: minted-sdt-trong-ten-duong-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.sdt_db
  verified_at: 2026-11-03T06:31:32Z
  output: |
    ℹ duration_ms 62299.828459
    db-thu: đã xoá oneinvest_sdt
    __EXIT=0

- eval: E4
  run_id: minted-sdt-trong-ten-duong-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.sdt_db
  verified_at: 2026-11-03T06:31:32Z
  output: |
    ℹ duration_ms 62299.828459
    db-thu: đã xoá oneinvest_sdt
    __EXIT=0

- eval: E5
  run_id: minted-sdt-trong-ten-duong-E5-r1
  exit_code: n-a (lệnh chưa chạy, bị guard từ chối)
  baseline: n-a
  verifier: config:executors.script.sdt_do
  verified_at: 2026-11-03T06:31:32Z
  output: |
    Lệnh khởi chạy (BƯỚC 1, run_in_background=true) bị công cụ từ chối trước khi chạy: worktree-isolated session không cho lệnh nêu git ở dạng quá phức tạp để kiểm chứng nằm trong worktree. Yêu cầu tách thành lệnh rời.
    Không có dòng __EXIT= nào; lệnh verify chưa chạy, chưa có nhật ký.

- eval: E6
  run_id: minted-sdt-trong-ten-duong-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.sdt_db
  verified_at: 2026-11-03T06:31:32Z
  output: |
    ℹ duration_ms 62299.828459
    db-thu: đã xoá oneinvest_sdt
    __EXIT=0

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-sdt-trong-ten-duong-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-03T06:31:32Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-sdt-trong-ten-duong-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-03T06:31:32Z

- cmd: cd app && npm test
  run_id: minted-sdt-trong-ten-duong-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-11-03T06:31:32Z

- cmd: cd pipeline && npm test
  run_id: minted-sdt-trong-ten-duong-SUITE-npm_test__13563d-r1
  exit_code: 1
  verified_at: 2026-11-03T06:31:32Z
  note: 447 ca, 446 qua, 1 đỏ — gan-sdt-s06.test.mjs:281 «GS-AC-2 chiều đỏ: AN-SO-BI-GHEP qua WHEN m.an THEN giu», lỗi không lấy được khoá quan hệ public.field_assertions (mã 55P03, khoá bảng bị giữ). Không gắn eval nào của feature này.

- cmd: cd app && npm run test:lint-rules
  run_id: minted-sdt-trong-ten-duong-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-03T06:31:32Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-sdt-trong-ten-duong-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-03T06:31:32Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED hạ tầng — lệnh baseline không chạy dòng nào (công cụ từ chối lời gọi, hoặc không ghi được tệp kịch bản) — công cụ trả: «This session is isolated in the worktree /Users/manhphan/dev/onehub-invest/.claude/worktrees/the-duyet-nguoi-nhieu-nhieu, but this command is too complex to verify that it stays inside the worktree. Refusing to run it — a worktree-isolated »

Không đo được ở round này nên chưa biết eval nào không phân biệt (pass trên cả HEAD lẫn baseline). Danh sách eval không phân biệt: none (chưa đo).

### Baseline khong do

- node --test pipeline/scripts/sdt-trong-duong.test.mjs pipeline/scripts/dac-trung-s06.test.mjs: BLOCKED hạ tầng baseline: lệnh baseline không chạy dòng nào (công cụ từ chối lời gọi, hoặc không ghi được tệp kịch bản) — công cụ trả: «This session is isolated in the worktree /Users/manhphan/dev/onehub-invest/.claude/worktrees/the-duyet-nguoi-nhieu-nhieu, but this command is too complex to verify that it stays inside the worktree. Refusing to run it — a worktree-isolated »
- bash db/db-thu.sh oneinvest_sdt && cd pipeline && DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_sdt node --test --test-concurrency=1 scripts/sdt-trong-duong.itest.mjs; r=$?; cd .. && bash db/db-thu.sh oneinvest_sdt --xoa; exit $r: BLOCKED hạ tầng baseline: lệnh baseline không chạy dòng nào (công cụ từ chối lời gọi, hoặc không ghi được tệp kịch bản) — công cụ trả: «This session is isolated in the worktree /Users/manhphan/dev/onehub-invest/.claude/worktrees/the-duyet-nguoi-nhieu-nhieu, but this command is too complex to verify that it stays inside the worktree. Refusing to run it — a worktree-isolated »
- bash db/db-thu.sh oneinvest_sdt_do && cd pipeline && DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_sdt_do node scripts/do-sdt-trong-duong.mjs; r=$?; cd .. && bash db/db-thu.sh oneinvest_sdt_do --xoa; exit $r: BLOCKED hạ tầng baseline: lệnh baseline không chạy dòng nào (công cụ từ chối lời gọi, hoặc không ghi được tệp kịch bản) — công cụ trả: «This session is isolated in the worktree /Users/manhphan/dev/onehub-invest/.claude/worktrees/the-duyet-nguoi-nhieu-nhieu, but this command is too complex to verify that it stays inside the worktree. Refusing to run it — a worktree-isolated »

## Variance

none — mọi eval nhiều lần chạy đều đồng đều (không eval nào có runs lớn hơn 1).

## Iterations

Round 1: E5 chưa chạy được — guard của worktree từ chối lệnh BƯỚC 1; lệnh suite pipeline npm test còn một ca đỏ ngoài eval (khoá bảng field_assertions). Cần người điều phối xác nhận cách chạy E5 rồi chạy lại.
