---
schema_version: 2
feature_slug: sdt-trong-ten-duong
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 36fc63c88b6309c1f15688f20fee318f19c78742
human_signoff:
---

# Evidence Report: sdt-trong-ten-duong

Vòng 3. Sáu eval của tính năng đều xanh, nhưng lệnh suite `cd pipeline && npm test` đỏ và không gắn eval nào, nên tổng thể là REJECT (failed_evals để trống vì không eval nào đỏ).

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-1 | script | PASS |
| E3 | AC-2 | script | PASS |
| E4 | AC-3 | script | PASS |
| E5 | AC-4 | script | PASS |
| E6 | AC-5 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-sdt-trong-ten-duong-E1-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sdt_doc
  verified_at: 2026-11-03T10:27:19Z
  output: |
    ℹ duration_ms 61.222041

- eval: E2
  run_id: minted-sdt-trong-ten-duong-E2-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.sdt_db
  verified_at: 2026-11-03T10:27:19Z
  output: |
    ℹ todo 0
    ℹ duration_ms 94440.006292

- eval: E3
  run_id: minted-sdt-trong-ten-duong-E3-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.sdt_db
  verified_at: 2026-11-03T10:27:19Z
  output: |
    ℹ todo 0
    ℹ duration_ms 94440.006292

- eval: E4
  run_id: minted-sdt-trong-ten-duong-E4-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.sdt_db
  verified_at: 2026-11-03T10:27:19Z
  output: |
    ℹ todo 0
    ℹ duration_ms 94440.006292

- eval: E5
  run_id: 277b8d940bad
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.sdt_do
  verified_at: 2026-11-03T10:27:19Z
  output: |
    dòng in chứa dãy số của lượt này: 0

- eval: E6
  run_id: minted-sdt-trong-ten-duong-E6-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.sdt_db
  verified_at: 2026-11-03T10:27:19Z
  output: |
    ℹ todo 0
    ℹ duration_ms 94440.006292

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-sdt-trong-ten-duong-SUITE-npm_test__bb6271-r3
  exit_code: 0
  verified_at: 2026-11-03T10:27:19Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-sdt-trong-ten-duong-SUITE-lint-r3
  exit_code: 0
  verified_at: 2026-11-03T10:27:19Z

- cmd: cd app && npm test
  run_id: minted-sdt-trong-ten-duong-SUITE-npm_test__bd9a35-r3
  exit_code: 0
  verified_at: 2026-11-03T10:27:19Z

- cmd: cd pipeline && npm test
  run_id: minted-sdt-trong-ten-duong-SUITE-npm_test__13563d-r3
  exit_code: 1
  verified_at: 2026-11-03T10:27:19Z
  ghi chú: lệnh không gắn eval nào. Hai ca đỏ. Ca `GS-AC-3a chuyển ẩn số` ở scripts/gan-sdt-s06.test.mjs không lấy được khoá bảng `public.sale_offer_records` (mã 55P03, lỗi khoá, qua khoaNguon trong lib/luoc-do-rieng.mjs). Ca `AC-4 rút offer giả qua đối soát` ở scripts/test-posts.test.mjs quá hạn 300000ms. Cả hai nằm ngoài các tệp kiểm của tính năng này.

- cmd: cd app && npm run test:lint-rules
  run_id: minted-sdt-trong-ten-duong-SUITE-test_lint_rules-r3
  exit_code: 0
  verified_at: 2026-11-03T10:27:19Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-sdt-trong-ten-duong-SUITE-node_scripts_check_portal_compliance_mjs-r3
  exit_code: 0
  verified_at: 2026-11-03T10:27:19Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «This session is isolated in the worktree /Users/manhphan/dev/onehub-invest/.claude/worktrees/the-duyet-nguoi-nhieu-nhieu, but this command is too complex to verify that it stays inside the worktree. Refusing to run it — a worktree-isolated »

Baseline không đo ở vòng này nên không xác định được eval nào không phân biệt. Mọi field baseline ghi n-a.

none — moi eval feature deu red tren baseline (co phan biet) không đo được ở vòng này vì baseline bị chặn hạ tầng.

Baseline khong do:
- node --test pipeline/scripts/sdt-trong-duong.test.mjs pipeline/scripts/dac-trung-s06.test.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «This session is isolated in the worktree /Users/manhphan/dev/onehub-invest/.claude/worktrees/the-duyet-nguoi-nhieu-nhieu, but this command is too complex to verify that it stays inside the worktree. Refusing to run it — a worktree-isolated »
- bash db/db-thu.sh oneinvest_sdt && cd pipeline && DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_sdt node --test --test-concurrency=1 scripts/sdt-trong-duong.itest.mjs; r=$?; cd .. && bash db/db-thu.sh oneinvest_sdt --xoa; exit $r: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «This session is isolated in the worktree /Users/manhphan/dev/onehub-invest/.claude/worktrees/the-duyet-nguoi-nhieu-nhieu, but this command is too complex to verify that it stays inside the worktree. Refusing to run it — a worktree-isolated »
- cd pipeline && DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_sdt_do node scripts/do-sdt-trong-duong.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «This session is isolated in the worktree /Users/manhphan/dev/onehub-invest/.claude/worktrees/the-duyet-nguoi-nhieu-nhieu, but this command is too complex to verify that it stays inside the worktree. Refusing to run it — a worktree-isolated »

## Judge

Không có panel judge ở vòng này.

## Variance

none — every multi-run eval is uniform (mọi eval chạy một lần, xác định, không phương sai).

## Iterations

Round 1: lượt chấm 1 trả về, sửa che số trong nhật ký căn cũ và siết thước đo (commit e503b444).
Round 2: lượt chấm 2 trả về, sửa thước số trong tên đường chạy hai bước (commit 36fc63c8).
Round 3: sáu eval xanh nhưng lệnh suite `cd pipeline && npm test` đỏ (hai ca không thuộc tệp kiểm của tính năng: lỗi khoá bảng và quá hạn). Verdict REJECT, trả về cho người quyết.
