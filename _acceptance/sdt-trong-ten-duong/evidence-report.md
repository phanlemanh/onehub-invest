---
schema_version: 2
feature_slug: sdt-trong-ten-duong
verdict: BLOCKED
failed_evals: []
reason: "E5 (bước 1, khởi chạy nền, lệnh đã ghim đúng nguyên văn: bash db/db-thu.sh oneinvest_sdt_do rồi node scripts/do-sdt-trong-duong.mjs trong pipeline/) bị cơ chế cách ly worktree của công cụ Bash từ chối trước khi thực thi, nên chưa có nhật ký r2-l3-1-20261103065044.log và chưa có dòng kết thúc. Không chạy được bước 2 vì chưa có tiến trình nào. Không tách lệnh, không viết script thay thế, không đổi cấu trúc lệnh để vượt kiểm tra. Cần người điều phối quyết định cách chạy lệnh này (ví dụ từ một phiên không bị cách ly worktree, hoặc cho phép lệnh này) rồi chạy lại lệnh đã ghim."
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: e503b4445bb70587d6cd6ccb01dc8266515f99ec
human_signoff:
---

# Evidence Report: sdt-trong-ten-duong

Round 2. Verdict BLOCKED: E5 (AC-4) chưa chạy được vì công cụ từ chối lệnh, không phải vì mã sai. Năm eval còn lại (E1, E2, E3, E4, E6) đều xanh.

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
  run_id: minted-sdt-trong-ten-duong-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sdt_doc
  verified_at: 2026-11-03T06:50:44Z
  output: |
    ℹ duration_ms 52.75775
    __EXIT=0

- eval: E2
  run_id: minted-sdt-trong-ten-duong-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.sdt_db
  verified_at: 2026-11-03T06:50:44Z
  output: |
    ℹ todo 0
    ℹ duration_ms 62481.279708
    __EXIT=0

- eval: E3
  run_id: minted-sdt-trong-ten-duong-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.sdt_db
  verified_at: 2026-11-03T06:50:44Z
  output: |
    ℹ todo 0
    ℹ duration_ms 62481.279708
    __EXIT=0

- eval: E4
  run_id: minted-sdt-trong-ten-duong-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.sdt_db
  verified_at: 2026-11-03T06:50:44Z
  output: |
    ℹ todo 0
    ℹ duration_ms 62481.279708
    __EXIT=0

- eval: E6
  run_id: minted-sdt-trong-ten-duong-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.sdt_db
  verified_at: 2026-11-03T06:50:44Z
  output: |
    ℹ todo 0
    ℹ duration_ms 62481.279708
    __EXIT=0

- eval: E5
  run_id: minted-sdt-trong-ten-duong-E5-r2
  exit_code: n-a (lệnh không chạy được, bị công cụ từ chối trước khi thực thi)
  baseline: n-a
  verifier: config:executors.script.sdt_do
  verified_at: 2026-11-03T06:50:44Z
  output: |
    Bash bị từ chối trước khi chạy, không có đầu ra từ lệnh: cơ chế cách ly worktree báo lệnh nêu git ở dạng quá phức tạp để xác minh nằm trong worktree, và yêu cầu tách thành các lệnh đơn giản riêng.
    Không có nhật ký, không có dòng kết thúc.

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-sdt-trong-ten-duong-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-11-03T06:50:44Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-sdt-trong-ten-duong-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-03T06:50:44Z

- cmd: cd app && npm test
  run_id: minted-sdt-trong-ten-duong-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-11-03T06:50:44Z

- cmd: cd pipeline && npm test
  run_id: minted-sdt-trong-ten-duong-SUITE-npm_test__13563d-r2
  exit_code: 1
  verified_at: 2026-11-03T06:50:44Z
  note: 447 ca, 446 qua, 1 hỏng. Ca hỏng là «GS-AC-2 chiều đỏ: AN-SO-BI-GHEP qua WHEN m.an THEN 'giu'» ở scripts/gan-sdt-s06.test.mjs, lỗi không lấy được khoá trên bảng field_assertions (mã 55P03, ca chờ khoá hơn 100 giây). Lệnh này không gắn eval nào.

- cmd: cd app && npm run test:lint-rules
  run_id: minted-sdt-trong-ten-duong-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-03T06:50:44Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-sdt-trong-ten-duong-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-11-03T06:50:44Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «This session is isolated in the worktree /Users/manhphan/dev/onehub-invest/.claude/worktrees/the-duyet-nguoi-nhieu-nhieu, but this command is too complex to verify that it stays inside the worktree. Refusing to run it — a worktree-isolated »

Baseline khong do:
- node --test pipeline/scripts/sdt-trong-duong.test.mjs pipeline/scripts/dac-trung-s06.test.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «This session is isolated in the worktree /Users/manhphan/dev/onehub-invest/.claude/worktrees/the-duyet-nguoi-nhieu-nhieu, but this command is too complex to verify that it stays inside the worktree. Refusing to run it — a worktree-isolated »
- bash db/db-thu.sh oneinvest_sdt && cd pipeline && DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_sdt node --test --test-concurrency=1 scripts/sdt-trong-duong.itest.mjs; r=$?; cd .. && bash db/db-thu.sh oneinvest_sdt --xoa; exit $r: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «This session is isolated in the worktree /Users/manhphan/dev/onehub-invest/.claude/worktrees/the-duyet-nguoi-nhieu-nhieu, but this command is too complex to verify that it stays inside the worktree. Refusing to run it — a worktree-isolated »
- bash db/db-thu.sh oneinvest_sdt_do && cd pipeline && DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_sdt_do node scripts/do-sdt-trong-duong.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «This session is isolated in the worktree /Users/manhphan/dev/onehub-invest/.claude/worktrees/the-duyet-nguoi-nhieu-nhieu, but this command is too complex to verify that it stays inside the worktree. Refusing to run it — a worktree-isolated »

Eval không-phân-biệt: none — moi eval feature deu red tren baseline (co phan biet). Lưu ý: round này baseline không đo được nên điều này chưa kiểm chứng; danh sách không-phân-biệt không đo được.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: lượt chấm 1 đã trả về triển khai, sửa ở commit e503b444 (che số trong nhật ký căn cũ, thước đo chặt hơn); chi tiết round 1 không có trong dữ liệu truyền xuống.
Round 2: E1, E2, E3, E4, E6 xanh; E5 BLOCKED vì công cụ Bash từ chối lệnh ghim do cách ly worktree. Cần chạy lại E5 từ phiên không bị cách ly hoặc được phép lệnh này, không phải sửa mã.
