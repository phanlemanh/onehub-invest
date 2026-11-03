---
schema_version: 2
feature_slug: sdt-trong-ten-duong
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 955f139a86313a2c3556aa9a4999618e58a4f49f
human_signoff: Mạnh 2026-11-03
---

# Evidence Report: sdt-trong-ten-duong

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
  run_id: minted-sdt-trong-ten-duong-E1-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sdt_doc
  verified_at: 2026-11-03T12:19:42Z
  output: |
    cmd: node --test pipeline/scripts/sdt-trong-duong.test.mjs pipeline/scripts/dac-trung-s06.test.mjs
    ℹ duration_ms 46.949875

- eval: E2
  run_id: minted-sdt-trong-ten-duong-E2-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.sdt_db
  verified_at: 2026-11-03T12:19:42Z
  output: |
    cmd: bash db/db-thu.sh oneinvest_sdt && cd pipeline && DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_sdt node --test --test-concurrency=1 scripts/sdt-trong-duong.itest.mjs; r=$?; cd .. && bash db/db-thu.sh oneinvest_sdt --xoa; exit $r
    ℹ todo 0
    ℹ duration_ms 30804.97675

- eval: E3
  run_id: minted-sdt-trong-ten-duong-E3-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.sdt_db
  verified_at: 2026-11-03T12:19:42Z
  output: |
    cùng lệnh với E2 (một lượt chạy bộ itest phủ E2, E3, E4, E6)
    ℹ todo 0
    ℹ duration_ms 30804.97675

- eval: E4
  run_id: minted-sdt-trong-ten-duong-E4-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.sdt_db
  verified_at: 2026-11-03T12:19:42Z
  output: |
    cùng lệnh với E2 (một lượt chạy bộ itest phủ E2, E3, E4, E6)
    ℹ todo 0
    ℹ duration_ms 30804.97675

- eval: E5
  run_id: minted-sdt-trong-ten-duong-E5-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.sdt_do
  verified_at: 2026-11-03T12:19:42Z
  output: |
    cmd: cd pipeline && DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_sdt_do node scripts/do-sdt-trong-duong.mjs
    dòng in chứa dãy số của lượt này: 0

- eval: E6
  run_id: minted-sdt-trong-ten-duong-E6-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.sdt_db
  verified_at: 2026-11-03T12:19:42Z
  output: |
    cùng lệnh với E2 (một lượt chạy bộ itest phủ E2, E3, E4, E6)
    ℹ todo 0
    ℹ duration_ms 30804.97675

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-sdt-trong-ten-duong-SUITE-npm_test__bb6271-r4
  exit_code: 0
  verified_at: 2026-11-03T12:19:42Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-sdt-trong-ten-duong-SUITE-lint-r4
  exit_code: 0
  verified_at: 2026-11-03T12:19:42Z

- cmd: cd app && npm test
  run_id: minted-sdt-trong-ten-duong-SUITE-npm_test__bd9a35-r4
  exit_code: 0
  verified_at: 2026-11-03T12:19:42Z

- cmd: cd pipeline && npm test
  run_id: minted-sdt-trong-ten-duong-SUITE-npm_test__13563d-r4
  exit_code: 0
  verified_at: 2026-11-03T12:19:42Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-sdt-trong-ten-duong-SUITE-test_lint_rules-r4
  exit_code: 0
  verified_at: 2026-11-03T12:19:42Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-sdt-trong-ten-duong-SUITE-node_scripts_check_portal_compliance_mjs-r4
  exit_code: 0
  verified_at: 2026-11-03T12:19:42Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «This session is isolated in the worktree /Users/manhphan/dev/onehub-invest/.claude/worktrees/the-duyet-nguoi-nhieu-nhieu, but this command is too complex to verify that it stays inside the worktree. Refusing to run it — a worktree-isolated »

Baseline khong do:
- node --test pipeline/scripts/sdt-trong-duong.test.mjs pipeline/scripts/dac-trung-s06.test.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «This session is isolated in the worktree /Users/manhphan/dev/onehub-invest/.claude/worktrees/the-duyet-nguoi-nhieu-nhieu, but this command is too complex to verify that it stays inside the worktree. Refusing to run it — a worktree-isolated »
- bash db/db-thu.sh oneinvest_sdt && cd pipeline && DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_sdt node --test --test-concurrency=1 scripts/sdt-trong-duong.itest.mjs; r=$?; cd .. && bash db/db-thu.sh oneinvest_sdt --xoa; exit $r: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «This session is isolated in the worktree /Users/manhphan/dev/onehub-invest/.claude/worktrees/the-duyet-nguoi-nhieu-nhieu, but this command is too complex to verify that it stays inside the worktree. Refusing to run it — a worktree-isolated »
- cd pipeline && DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_sdt_do node scripts/do-sdt-trong-duong.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «This session is isolated in the worktree /Users/manhphan/dev/onehub-invest/.claude/worktrees/the-duyet-nguoi-nhieu-nhieu, but this command is too complex to verify that it stays inside the worktree. Refusing to run it — a worktree-isolated »

Eval không-phân-biệt: none — baseline không đo được ở round này nên danh sách này không xác định được; không eval nào bị đánh dấu xanh trên cả hai phía.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: lượt chấm đầu phát hiện lỗi che số trong nhật ký căn cũ và thước đo chưa chặt — đã sửa, trả về triển khai.
Round 2: lượt chấm hai phát hiện lỗi ở thước chạy hai bước — đã sửa, trả về triển khai.
Round 3: REJECT ở trần lượt — đã sửa thước từ chối DB chung khi có cờ chạy kèm cờ chỉ đọc.
Round 4: E1, E2, E3, E4, E5, E6 đều xanh; lệnh suite xanh; không có mục judgment, không có phương sai.
