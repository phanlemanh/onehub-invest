---
schema_version: 2
feature_slug: the-duyet-nguoi-nhieu-nhieu
verdict: REJECT
failed_evals: []
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: a46a0982a6b0a6269d7bdc6c1edea76363f45c19
human_signoff:
---

# Evidence Report: the-duyet-nguoi-nhieu-nhieu

Round 1. Lý do REJECT: lệnh suite `cd app && npm test` đỏ, không gắn eval nào (các eval E1–E13 đều xanh). Chi tiết ở mục Evidence, phần «Lệnh suite (hồi quy)».

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
  baseline: n-a
  verifier: config:executors.test.the_duyet_nguoi
  verified_at: 2026-11-01T09:18:21Z
  output: |
    cd pipeline && node --test scripts/the-duyet-nguoi.test.mjs
    ℹ duration_ms 208.2465

- eval: E2
  run_id: minted-the-duyet-nguoi-nhieu-nhieu-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.the_duyet_nguoi_db
  verified_at: 2026-11-01T09:18:21Z
  output: |
    cd pipeline && node --test scripts/the-duyet-nguoi.itest.mjs (DB thử u2)
    ℹ duration_ms 334537.318791

- eval: E3
  run_id: minted-the-duyet-nguoi-nhieu-nhieu-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.the_duyet_nguoi_db
  verified_at: 2026-11-01T09:18:21Z
  output: |
    cùng lệnh với E2
    ℹ duration_ms 334537.318791

- eval: E4
  run_id: minted-the-duyet-nguoi-nhieu-nhieu-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.the_duyet_nguoi_db
  verified_at: 2026-11-01T09:18:21Z
  output: |
    cùng lệnh với E2
    ℹ duration_ms 334537.318791

- eval: E5
  run_id: minted-the-duyet-nguoi-nhieu-nhieu-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.the_duyet_nguoi_db
  verified_at: 2026-11-01T09:18:21Z
  output: |
    cùng lệnh với E2
    ℹ duration_ms 334537.318791

- eval: E6
  run_id: minted-the-duyet-nguoi-nhieu-nhieu-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.the_duyet_nguoi_db
  verified_at: 2026-11-01T09:18:21Z
  output: |
    cùng lệnh với E2
    ℹ duration_ms 334537.318791

- eval: E7
  run_id: minted-the-duyet-nguoi-nhieu-nhieu-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.the_duyet_nguoi_db
  verified_at: 2026-11-01T09:18:21Z
  output: |
    cùng lệnh với E2
    ℹ duration_ms 334537.318791

- eval: E8
  run_id: minted-the-duyet-nguoi-nhieu-nhieu-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.review_nguoi
  verified_at: 2026-11-01T09:18:21Z
  output: |
    cd app && node --import tsx --test tests/review-nguoi.test.tsx
    ℹ duration_ms 2229.438458

- eval: E9
  run_id: minted-the-duyet-nguoi-nhieu-nhieu-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: ui-check (driver trình duyệt, khung lưu ở evidence/)
  verified_at: 2026-11-01T09:18:21Z
  screenshot: evidence/E9-step1.png
  observed: |
    E9-step1.png (1440x1000): ngăn chi tiết bên phải mở trên nền danh sách mờ. Tiêu đề «Gộp Người? S03 · 2 tài khoản · 2 SĐT», #158765, badge data_quality và «Chờ duyệt». Khối «Gộp Người?» có nhãn S03 và dòng «gộp hết thành một Người, hay giữ tách». Bảng Tài khoản/Số tin có Ngọc Anh · 5333810493999152180 (2) và Kim Thư · 8586431247974526232 (27). Bảng SĐT/Số tin có +84375385810 (27) và +84966390696 (1). Bảng Tin mẫu có 5 dòng offer_… kèm giá, diện tích, ngày. Cuối ngăn có ô Lý do (placeholder «Vì sao bạn quyết như vậy…»), dòng «Ghi lý do trước khi quyết» và ba nút Gộp thành một Người / Giữ tách / Hoãn. Khớp Expected.
    E9-step2.png (375x812): cùng thẻ xếp dọc một cột. Tài khoản, SĐT và Tin mẫu không tràn ngang trang. Cột Ngày của Tin mẫu bị cắt («2026·»). Ô Lý do và ba nút thấy rõ, nút đầu bị biểu tượng dev «N» che một phần. Không có thanh cuộn ngang của trang.
    E9-step3.png (375): giống step2 (thẻ vừa khung, không cần cuộn). Khớp Expected: thẻ đủ thành phần, khổ hẹp không tràn ngang.
  network_observed: no-app-traffic

- eval: E10
  run_id: minted-the-duyet-nguoi-nhieu-nhieu-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nguoi_nap_lai_u2
  verified_at: 2026-11-01T09:18:21Z
  output: |
    cd pipeline && node scripts/nap-lai-nguoi.mjs --the-duyet (DB thử u2)
    nap-lai-nguoi: ĐẠT

- eval: E11
  run_id: minted-the-duyet-nguoi-nhieu-nhieu-E11-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.the_duyet_nguoi
  verified_at: 2026-11-01T09:18:21Z
  output: |
    cùng lệnh với E1
    ℹ duration_ms 208.2465

- eval: E12
  run_id: `
  exit_code: 0
  baseline: green
  verifier: config:executors.test.nguoi_db
  verified_at: 2026-11-01T09:18:21Z
  output: |
    cd pipeline && node --test scripts/danh-ba-nguoi.itest.mjs (DB p3_nguoi)
    ℹ duration_ms 27097.830917

- eval: E13
  run_id: minted-the-duyet-nguoi-nhieu-nhieu-E13-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.the_duyet_nguoi_db
  verified_at: 2026-11-01T09:18:21Z
  output: |
    cùng lệnh với E2
    ℹ duration_ms 334537.318791

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-the-duyet-nguoi-nhieu-nhieu-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-01T09:18:21Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-the-duyet-nguoi-nhieu-nhieu-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-01T09:18:21Z

- cmd: cd app && npm test
  run_id: minted-the-duyet-nguoi-nhieu-nhieu-SUITE-npm_test__bd9a35-r1
  exit_code: 1
  verified_at: 2026-11-01T09:18:21Z
  output: |
    Đỏ ở tests/ops-nhan-theo-context.test.tsx, ca «ON12-AC-1 danh sách tệp quét thiếu một tệp → đỏ nêu tệp»:
    danh sách tệp quét thực tế có thêm src/components/ops/review-card-nguoi.tsx (tệp mới của feature),
    còn danh sách mong đợi trong test chỉ có src/components/ops/review-content.tsx.
    Lệnh không gắn eval nào của feature.

- cmd: cd pipeline && npm test
  run_id: minted-the-duyet-nguoi-nhieu-nhieu-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-11-01T09:18:21Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-the-duyet-nguoi-nhieu-nhieu-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-01T09:18:21Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-the-duyet-nguoi-nhieu-nhieu-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-01T09:18:21Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh cả trên HEAD lẫn baseline):
- cd pipeline && DATABASE_URL=${NGUOI_DB_URL:-postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p3_nguoi} node --test scripts/danh-ba-nguoi.itest.mjs: E12 (regression-guard có chủ ý cho HD13 đã ký)

Baseline không đo:
- cd pipeline && node --test scripts/the-duyet-nguoi.test.mjs: bo qua baseline: tep pipeline/scripts/the-duyet-nguoi.test.mjs co o cay dang kiem nhung chua co o merge-base ed0ff2cd05fbb50b214d03fa6de426060a51d6da — eval moi, chay tren code cu khong phan biet gi
- cd pipeline && DATABASE_URL=${NGUOI_U2_DB_URL:-postgres://oneinvest:oneinvest@localhost:5433/oneinvest_u2_nguoi} node --test scripts/the-duyet-nguoi.itest.mjs: bo qua baseline: tep pipeline/scripts/the-duyet-nguoi.itest.mjs co o cay dang kiem nhung chua co o merge-base ed0ff2cd05fbb50b214d03fa6de426060a51d6da — eval moi, chay tren code cu khong phan biet gi
- cd app && node --import tsx --test tests/review-nguoi.test.tsx: bo qua baseline: tep app/tests/review-nguoi.test.tsx co o cay dang kiem nhung chua co o merge-base ed0ff2cd05fbb50b214d03fa6de426060a51d6da — eval moi, chay tren code cu khong phan biet gi
- cd pipeline && DATABASE_URL=${NGUOI_U2_DB_URL:-postgres://oneinvest:oneinvest@localhost:5433/oneinvest_u2_nguoi} node scripts/nap-lai-nguoi.mjs --the-duyet: baseline vuot tran 180 giay/lenh — da dung ca cay tien trinh; BLOCKED ha tang, khong phai ket qua cua code cu

Lệnh fail không gắn eval: `cd app && npm test` (xem khối suite ở trên).

## Variance

none — mọi eval nhiều lần chạy đều đồng nhất (mọi eval chạy một lần, deterministic).

## Iterations

Round 1: không eval nào đỏ, nhưng lệnh suite `cd app && npm test` đỏ ở ca ON12-AC-1 (tests/ops-nhan-theo-context.test.tsx) vì danh sách tệp quét có thêm review-card-nguoi.tsx của feature mà test chưa cập nhật. Trả về triển khai: cập nhật danh sách mong đợi (hoặc đưa tệp mới vào luật nhãn theo context) rồi verify lại.
