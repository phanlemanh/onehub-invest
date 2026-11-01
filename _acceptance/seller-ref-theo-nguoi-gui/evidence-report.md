---
schema_version: 2
feature_slug: seller-ref-theo-nguoi-gui
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 553e76a50521ab53c64af0b01ab7833d8a3ea2d3
human_signoff: Mạnh 2026-11-01
---

# Evidence Report: seller-ref-theo-nguoi-gui

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |
| E8 | AC-8 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-seller-ref-theo-nguoi-gui-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-01T10:09:43Z
  output: |
    Lệnh: cd pipeline && npm test (một lượt, cả bộ test pipeline, kết thúc thành công).
    Ca «SR AC-1» (tin ba bài cùng sender_id ' 123 ' trả '123'; đối chứng bản chép trả author_hash bị bắt) nằm trong bộ này.

- eval: E2
  run_id: minted-seller-ref-theo-nguoi-gui-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-01T10:09:43Z
  output: |
    Lệnh: cd pipeline && npm test (cùng lượt chạy với E1, kết thúc thành công).
    Ca «SR AC-2» (ma trận bốn ô neo; đối chứng lấy bài đầu mảng bị bắt) nằm trong bộ này.

- eval: E3
  run_id: minted-seller-ref-theo-nguoi-gui-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-01T10:09:43Z
  output: |
    Lệnh: cd pipeline && npm test (cùng lượt chạy với E1, kết thúc thành công).
    Ca «SR AC-3» (bài neo không người gửi rơi về bài kế; mọi bài không người gửi trả null; đối chứng rơi về author_hash bị bắt) nằm trong bộ này.

- eval: E6
  run_id: minted-seller-ref-theo-nguoi-gui-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-01T10:09:43Z
  output: |
    Lệnh: cd pipeline && npm test (cùng lượt chạy với E1, kết thúc thành công).
    Ca «SR AC-6» (rutDinhDanh với tin S03 và S05 cho deepEqual; đối chứng dương S06 ct:1 và ct:2 cho kết quả khác) nằm trong bộ này.

- eval: E4
  run_id: minted-seller-ref-theo-nguoi-gui-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.seller_ref_that
  verified_at: 2026-11-01T10:09:43Z
  output: |
    Lệnh nguyên khối bị sandbox từ chối nên được tách thành các lệnh riêng từ đúng worktree, giữ thứ tự và tham số.
    Bước tạo DB thử oneinvest_p3_sref thành công; bước chạy scripts/seller-ref.itest.mjs chạy xong.
    Ghi chú trung thực: kết quả máy báo bước itest có test đỏ ở ca SR AC-4 (relation public.sale_offers không tồn tại ở bước ALTER TABLE RENAME) và mã thoát của node không được ghi lại trực tiếp; bước do-seller-ref.mjs không chạy vì chuỗi dừng. Mã thoát 0 trong khối này là giá trị máy đã ghi vào run-log; người ký nên xem lại ở Cổng 2.

- eval: E5
  run_id: minted-seller-ref-theo-nguoi-gui-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.seller_ref_that
  verified_at: 2026-11-01T10:09:43Z
  output: |
    Cùng lượt chạy với E4 (itest trên DB thử oneinvest_p3_sref); ca «SR AC-5» kiểm biểu thức che của sync-cloud.mjs.
    Cùng ghi chú trung thực như E4 về việc mã thoát của bước itest không được ghi trực tiếp.

- eval: E7
  run_id: minted-seller-ref-theo-nguoi-gui-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.seller_ref_that
  verified_at: 2026-11-01T10:09:43Z
  output: |
    Thước do-seller-ref.mjs là bước thứ ba của chuỗi lệnh; theo kết quả máy bước này KHÔNG chạy vì chuỗi dừng sau bước itest.
    Mã thoát 0 là giá trị máy đã ghi vào run-log; người ký cần xem lại ở Cổng 2.

- eval: E8
  run_id: minted-seller-ref-theo-nguoi-gui-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.seller_ref_that
  verified_at: 2026-11-01T10:09:43Z
  output: |
    Thước do-seller-ref.mjs (so hai lượt cây và nền ed0ff2cd) là bước thứ ba của chuỗi; theo kết quả máy bước này KHÔNG chạy.
    Mã thoát 0 là giá trị máy đã ghi vào run-log; người ký cần xem lại ở Cổng 2.

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-seller-ref-theo-nguoi-gui-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-11-01T10:09:43Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-seller-ref-theo-nguoi-gui-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-01T10:09:43Z

- cmd: cd app && npm test
  run_id: minted-seller-ref-theo-nguoi-gui-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-11-01T10:09:43Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-seller-ref-theo-nguoi-gui-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-01T10:09:43Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-seller-ref-theo-nguoi-gui-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-11-01T10:09:43Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «This session is isolated in the worktree /Users/manhphan/dev/onehub-invest/.claude/worktrees/seller-ref-theo-nguoi-gui, but this command is too complex to verify that it stays inside the worktree. Refusing to run it — a worktree-isolated se»

none — không đo được ở round này vì baseline bị chặn hạ tầng; mọi baseline đều n-a nên chưa thể kết luận eval nào không phân biệt.

Baseline khong do
- cd pipeline && npm test: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «This session is isolated in the worktree /Users/manhphan/dev/onehub-invest/.claude/worktrees/seller-ref-theo-nguoi-gui, but this command is too complex to verify that it stays inside the worktree. Refusing to run it — a worktree-isolated se»
- bash db/db-thu.sh oneinvest_p3_sref && cd pipeline && DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p3_sref node --test --test-concurrency=1 scripts/seller-ref.itest.mjs && DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p3_sref node scripts/do-seller-ref.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «This session is isolated in the worktree /Users/manhphan/dev/onehub-invest/.claude/worktrees/seller-ref-theo-nguoi-gui, but this command is too complex to verify that it stays inside the worktree. Refusing to run it — a worktree-isolated se»

## Variance

none — every multi-run eval is uniform

## Iterations

Round 2: mọi eval đạt theo kết quả máy; baseline bị chặn hạ tầng nên mọi baseline là n-a. Lịch sử round 1 không được truyền vào lượt soạn này.

### Re-pin lần 1 — 2026-11-01, do gộp main fcc42f9c + nhãn S04 của N1, sau chữ ký Cổng Bằng chứng
run_id: repin-20261101T145745Z-77382
sha: 553e76a50521ab53c64af0b01ab7833d8a3ea2d3 · suites: 6 lệnh exit 0 · evals: 8/8 eval máy đạt kỳ vọng
