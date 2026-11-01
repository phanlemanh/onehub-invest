---
schema_version: 2
feature_slug: the-duyet-nguoi-nhieu-nhieu
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: fdfc21d2d92540d6785546964bd88a21a8a559e1
human_signoff:
---

# Evidence Report: the-duyet-nguoi-nhieu-nhieu

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
| E9 | AC-8 | ui-check | PASS |
| E10 | AC-9 | test | PASS |
| E11 | AC-9 | test | PASS |
| E12 | AC-9 | test | PASS |
| E13 | AC-10 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-the-duyet-nguoi-nhieu-nhieu-E1-r1
  exit_code: 0
  verifier: config:executors.test.the_duyet_nguoi
  verified_at: 2026-11-01T09:18:21Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E2
  run_id: minted-the-duyet-nguoi-nhieu-nhieu-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.the_duyet_nguoi_db
  verified_at: 2026-11-01T10:36:44Z
  output: |
    ℹ duration_ms 23676.02025

- eval: E3
  run_id: minted-the-duyet-nguoi-nhieu-nhieu-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.the_duyet_nguoi_db
  verified_at: 2026-11-01T10:36:44Z
  output: |
    ℹ duration_ms 23676.02025

- eval: E4
  run_id: minted-the-duyet-nguoi-nhieu-nhieu-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.the_duyet_nguoi_db
  verified_at: 2026-11-01T10:36:44Z
  output: |
    ℹ duration_ms 23676.02025

- eval: E5
  run_id: minted-the-duyet-nguoi-nhieu-nhieu-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.the_duyet_nguoi_db
  verified_at: 2026-11-01T10:36:44Z
  output: |
    ℹ duration_ms 23676.02025

- eval: E6
  run_id: minted-the-duyet-nguoi-nhieu-nhieu-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.the_duyet_nguoi_db
  verified_at: 2026-11-01T10:36:44Z
  output: |
    ℹ duration_ms 23676.02025

- eval: E7
  run_id: minted-the-duyet-nguoi-nhieu-nhieu-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.the_duyet_nguoi_db
  verified_at: 2026-11-01T10:36:44Z
  output: |
    ℹ duration_ms 23676.02025

- eval: E8
  run_id: minted-the-duyet-nguoi-nhieu-nhieu-E8-r1
  exit_code: 0
  verifier: config:executors.test.review_nguoi
  verified_at: 2026-11-01T09:18:21Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E9
  run_id: minted-the-duyet-nguoi-nhieu-nhieu-E9-r1
  exit_code: 0
  verifier: config:dev_server.start   # tác tử chấm lái ego-browser trên máy dev của worktree (:3462); bản tổng hợp ghi nhầm khoá executors.ui-check không có trong config — sổ d-20261101T135958Z-17
  verified_at: 2026-11-01T09:18:21Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval
  screenshot: evidence/E9-step1.png
  observed: |
    E9-step1.png (1440x1000): ngăn chi tiết bên phải mở trên nền danh sách mờ. Tiêu đề «Gộp Người? S03 · 2 tài khoản · 2 SĐT», #158765, badge data_quality và «Chờ duyệt». Khối «Gộp Người?» có nhãn S03 và dòng «gộp hết thành một Người, hay giữ tách». Bảng Tài khoản/Số tin có Ngọc Anh · 5333810493999152180 (2) và Kim Thư · 8586431247974526232 (27). Bảng SĐT/Số tin có +84375385810 (27) và +84966390696 (1). Bảng Tin mẫu có 5 dòng offer_… kèm giá, diện tích, ngày. Cuối ngăn có ô Lý do (placeholder «Vì sao bạn quyết như vậy…»), dòng «Ghi lý do trước khi quyết» và ba nút Gộp thành một Người / Giữ tách / Hoãn. Khớp Expected.
    E9-step2.png (375x812): cùng thẻ xếp dọc một cột. Tài khoản, SĐT và Tin mẫu không tràn ngang trang. Cột Ngày của Tin mẫu bị cắt («2026·»). Ô Lý do và ba nút thấy rõ, nút đầu bị biểu tượng dev «N» che một phần. Không có thanh cuộn ngang của trang.
    E9-step3.png (375): giống step2 (thẻ vừa khung, không cần cuộn). Khớp Expected: thẻ đủ thành phần, khổ hẹp không tràn ngang.
  network_observed: no-app-traffic

- eval: E10
  run_id: minted-the-duyet-nguoi-nhieu-nhieu-E10-r1
  exit_code: 0
  verifier: config:executors.test.nguoi_nap_lai_u2
  verified_at: 2026-11-01T09:18:21Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E11
  run_id: minted-the-duyet-nguoi-nhieu-nhieu-E11-r1
  exit_code: 0
  verifier: config:executors.test.the_duyet_nguoi
  verified_at: 2026-11-01T09:18:21Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E12
  run_id: minted-the-duyet-nguoi-nhieu-nhieu-E12-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.nguoi_db
  verified_at: 2026-11-01T10:36:44Z
  output: |
    ℹ duration_ms 18009.392084

- eval: E13
  run_id: minted-the-duyet-nguoi-nhieu-nhieu-E13-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.the_duyet_nguoi_db
  verified_at: 2026-11-01T10:36:44Z
  output: |
    ℹ duration_ms 23676.02025

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-the-duyet-nguoi-nhieu-nhieu-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-11-01T10:36:44Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-the-duyet-nguoi-nhieu-nhieu-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-01T10:36:44Z

- cmd: cd app && npm test
  run_id: minted-the-duyet-nguoi-nhieu-nhieu-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-11-01T10:36:44Z

- cmd: cd pipeline && npm test
  run_id: minted-the-duyet-nguoi-nhieu-nhieu-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-11-01T10:36:44Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-the-duyet-nguoi-nhieu-nhieu-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-01T10:36:44Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-the-duyet-nguoi-nhieu-nhieu-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-11-01T10:36:44Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không-phân-biệt (xanh trên cả HEAD lẫn baseline):
- E12 (cd pipeline && DATABASE_URL=${NGUOI_DB_URL:-postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p3_nguoi} node --test scripts/danh-ba-nguoi.itest.mjs): regression-guard có chủ ý cho test HD13 đã ký, baseline green.

Baseline không đo:
- cd pipeline && DATABASE_URL=${NGUOI_U2_DB_URL:-postgres://oneinvest:oneinvest@localhost:5433/oneinvest_u2_nguoi} node --test scripts/the-duyet-nguoi.itest.mjs: bo qua baseline: tep pipeline/scripts/the-duyet-nguoi.itest.mjs co o cay dang kiem nhung chua co o merge-base ed0ff2cd05fbb50b214d03fa6de426060a51d6da — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: S4 vòng 1 bị trả lại, thước trong hợp đồng được sửa (commit fdfc21d2). Returned to implementation.
Round 2: chạy lại E2-E7, E12, E13 và sáu lệnh suite, tất cả xanh; E1, E8, E9, E10, E11 carry-forward từ round 1 vì delta không chạm paths của chúng.
