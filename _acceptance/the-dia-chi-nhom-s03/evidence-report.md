---
schema_version: 2
feature_slug: the-dia-chi-nhom-s03
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 3d1befe7c2eaad690e2c0069818408ecca4f59e4
human_signoff:
---

# Evidence Report: the-dia-chi-nhom-s03

Vòng 8. Không có eval nào của hợp đồng thất bại; verdict REJECT vì một lệnh suite hồi quy không gắn eval (kiểm kiểu và lint của app) báo lỗi, xem mục «Lệnh suite (hồi quy)» và mục Iterations.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | ui-check | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | script | PASS |
| E9 | AC-9 | test | PASS |
| E10 | AC-10 | judgment | PASS (đề xuất của hội đồng, chờ người chốt) |

## Evidence

- eval: E1
  run_id: minted-the-dia-chi-nhom-s03-E1-r8
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg1_db
  verified_at: 2026-11-16T22:39:05Z
  output: |
    lệnh: bash db/db-thu.sh oneinvest_suite_tg1 --chay node --test --test-concurrency=1 pipeline/tests/the-dia-chi-nhom.itest.mjs
    ℹ duration_ms 11955.710292

- eval: E2
  run_id: minted-the-dia-chi-nhom-s03-E2-r8
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg1_unit
  verified_at: 2026-11-16T22:39:05Z
  output: |
    lệnh: node --test pipeline/tests/the-dia-chi-nhom.test.mjs
    ℹ duration_ms 51.144125

- eval: E3
  run_id: minted-the-dia-chi-nhom-s03-E3-r8
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg1_db
  verified_at: 2026-11-16T22:39:05Z
  output: |
    lệnh: bash db/db-thu.sh oneinvest_suite_tg1 --chay node --test --test-concurrency=1 pipeline/tests/the-dia-chi-nhom.itest.mjs
    ℹ duration_ms 11955.710292

- eval: E4
  run_id: minted-the-dia-chi-nhom-s03-E4-r8
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg1_app
  verified_at: 2026-11-16T22:39:05Z
  output: |
    lệnh: cd app && bash ../db/db-thu.sh oneinvest_suite_tg1a --chay node --import tsx --test --test-concurrency=1 tests/the-dia-chi-nhom-app.itest.tsx
    ℹ duration_ms 10780.183834

- eval: E5
  run_id: E5-the-dia-chi-nhom-s03-20261117
  exit_code: 0
  baseline: n-a
  verifier: config:dev_server.start
  verified_at: 2026-11-16T22:39:05Z
  screenshot: evidence/E5-step1.png
  observed: |
    Đã mở bằng Read các ảnh chính: step1, step1-cuoi, step2, step3, step4, step5-ly-do-ngan, step5, step-o-trong, step-409, step-viewer, step6, step6-hop (step4-truoc, step4-sua, step5-khong-ly-do, step5-co-ly-do là ảnh phụ cùng bước, chụp cùng lệnh).
    step1 (1280): bộ đếm «26 nhóm có thể» và «26 chờ duyệt» cạnh tiêu đề «Thẻ địa chỉ nhóm»; bảng cột Nhóm/Thẻ/Dự án/Phường·tỉnh/Phân khu/Bán·thuê/Bài đã đọc; mỗi hàng badge vàng «Nháp»; email thanh bên che bằng thanh đen. step1-cuoi: hai hàng mờ «Chưa có trong sổ» (TN-004, TN-006) ở cuối bảng.
    step2: hộp «Duyệt thẻ TN-008 Nháp» mở, 4 ô có dòng căn cứ (Dự án «từ bài đã đọc, 56 bài»; Phường «theo dự án»; Phân khu «Chưa đủ căn cứ (1.595 bài đã đọc)»; Bán/thuê «từ bài đã đọc: 275 bán, 1.185 thuê»); nút Bác mờ, Nhận đen. step3: TN-008 badge xanh «Đã duyệt», đầu trang «25 chờ duyệt». step4: TN-008 và TN-011 «Đã duyệt», TN-011 cột Bán/thuê «Bán», đầu trang «24 chờ duyệt».
    step5-ly-do-ngan: hộp TN-012 có «ab» trong ô Lý do, nút Bác mờ (vô hiệu), không có khối lỗi; step5: TN-012 badge đỏ «Bác», đầu trang «23 chờ duyệt». step-o-trong: hộp TN-005 bốn ô trống, mỗi ô có dòng «Chưa đủ căn cứ (1 bài đã đọc)». step-409: hộp TN-014 có Alert đỏ «thẻ đã đổi từ lúc anh mở — tải lại thẻ rồi làm lại» cùng nút «Tải lại thẻ», chữ đã nhập vẫn giữ, thêm khối vàng «Bỏ thay đổi chưa lưu?». step-viewer: tiêu đề «Xem thẻ TN-011 Đã duyệt», các ô Phường, Phân khu, Bán/thuê xám, chỉ có nút «Đóng», không có Nhận/Lưu sửa/Bác. step6 (375): tiêu đề và hai bộ đếm hiện trọn, bảng trong khung cuộn ngang nội bộ, trang không tràn; step6-hop: hộp vừa khung, các ô và nút xếp dọc, không tràn.
    Không có frame nào mâu thuẫn Expected. Hai lưu ý không làm thất bại: Bác không lý do bị chặn bằng nút vô hiệu (không có thông báo lỗi); ô Dự án của viewer không disabled nhưng không đổi được giá trị.
  network_observed: clean

- eval: E6
  run_id: minted-the-dia-chi-nhom-s03-E6-r8
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg1_app
  verified_at: 2026-11-16T22:39:05Z
  output: |
    lệnh: cd app && bash ../db/db-thu.sh oneinvest_suite_tg1a --chay node --import tsx --test --test-concurrency=1 tests/the-dia-chi-nhom-app.itest.tsx
    ℹ duration_ms 10780.183834

- eval: E7
  run_id: minted-the-dia-chi-nhom-s03-E7-r8
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tg1_that_dem
  verified_at: 2026-11-16T22:39:05Z
  output: |
    lệnh: node pipeline/scripts/the-dia-chi-nhom-that.mjs --dem --ghi .acceptance-runs/the-dia-chi-nhom-s03/so-chay-thu.md
    **ĐẠT**

- eval: E8
  run_id: minted-the-dia-chi-nhom-s03-E8-r8
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tg1_that_chat_luong
  verified_at: 2026-11-16T22:39:05Z
  output: |
    lệnh: node pipeline/scripts/the-dia-chi-nhom-that.mjs --chat-luong
    khớp 12/13 (đạt khi từ 9)

- eval: E9
  run_id: minted-the-dia-chi-nhom-s03-E9-r8
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg1_lui
  verified_at: 2026-11-16T22:39:05Z
  output: |
    lệnh: bash db/db-thu.sh oneinvest_suite_tg1l --chay node --test --test-concurrency=1 pipeline/tests/the-dia-chi-nhom-lui.itest.mjs
    ℹ duration_ms 2278.502708

### Judgment

- eval: E10
  judged_by: judge panel (domain-correctness, operational-feasibility, spec-alignment) — đề xuất, ngữ cảnh mới
  verdict: PASS
  rationale: Ba góc nhìn cùng đề xuất PASS (xem phiếu bên dưới). Eval khai input nên hội đồng chấm được; người quyết ở Cổng 2.
  human_override:  # chi nguoi ghi

Phiếu của hội đồng:
- domain-correctness: PASS — Cả hai ảnh ghi căn cứ dưới từng ô. Thẻ đủ ô có «từ bài đã đọc, 47 bài», «theo dự án», «254 bán, 1.033 thuê» và «Chưa đủ căn cứ (1.408 bài đã đọc)». Thẻ ô trống ghi «Chưa đủ căn cứ (1 bài đã đọc)» ở cả bốn ô. CONTEXT.md dòng 835 có mục «Thẻ địa chỉ nhóm» với nhãn, định nghĩa, mã `group_address_card`, mã thẻ `TN-001` và slug `group-cards`. Ô phường chỉ ghi «theo dự án», không có số bài riêng, nhưng nguồn đã rõ.
- operational-feasibility: PASS — Cả hai ảnh đều có dòng chú dưới mỗi ô. Thẻ đủ ô ghi «từ bài đã đọc, 47 bài», «theo dự án», «254 bán, 1.033 thuê». Thẻ ô trống ghi «Chưa đủ căn cứ (1 bài đã đọc)» ở cả bốn ô. Ô phường·tỉnh chỉ ghi «theo dự án», không nêu số bài riêng, nhưng nguồn đã rõ và số bài suy ra từ ô dự án. CONTEXT.md có mục «Thẻ địa chỉ nhóm» với nhãn, code `group_address_cards`, slug `group-cards`, định nghĩa nêu rõ mỗi ô ghi nguồn và số bài căn cứ, và dòng _Avoid_.
- spec-alignment: PASS — Cả hai ảnh đều ghi nguồn và số bài dưới mỗi ô. Thẻ đủ ô có «từ bài đã đọc, 47 bài», «theo dự án», «từ bài đã đọc: 254 bán, 1.033 thuê», và «Chưa đủ căn cứ (1.408 bài đã đọc)» cho phân khu. Thẻ có ô trống có «Chưa đủ căn cứ (1 bài đã đọc)» ở cả bốn ô. CONTEXT.md có mục «Thẻ địa chỉ nhóm» với nhãn, định nghĩa, mã `group_address_card` (thẻ dạng `TN-001`) và slug `group-cards`.

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-the-dia-chi-nhom-s03-SUITE-npm_test__bb6271-r8
  exit_code: 0
  verified_at: 2026-11-16T22:39:05Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-the-dia-chi-nhom-s03-SUITE-lint-r8
  exit_code: 2
  verified_at: 2026-11-16T22:39:05Z
  output: |
    .next/dev/types/validator.ts(5,79): error TS2307: Cannot find module './routes.js' or its corresponding type declarations.
    Lệnh này không gắn eval nào; lỗi nằm ở bước kiểm kiểu.

- cmd: cd app && npm test
  run_id: minted-the-dia-chi-nhom-s03-SUITE-npm_test__bd9a35-r8
  exit_code: 0
  verified_at: 2026-11-16T22:39:05Z

- cmd: cd pipeline && npm run test:a
  run_id: minted-the-dia-chi-nhom-s03-SUITE-test_a-r8
  exit_code: 0
  verified_at: 2026-11-16T22:39:05Z

- cmd: cd pipeline && npm run test:b
  run_id: minted-the-dia-chi-nhom-s03-SUITE-test_b-r8
  exit_code: 0
  verified_at: 2026-11-16T22:39:05Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-the-dia-chi-nhom-s03-SUITE-test_lint_rules-r8
  exit_code: 0
  verified_at: 2026-11-16T22:39:05Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-the-dia-chi-nhom-s03-SUITE-node_scripts_check_portal_compliance_mjs-r8
  exit_code: 0
  verified_at: 2026-11-16T22:39:05Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tù round 1 — baseline khong do lai round nay.

Không có eval nào cần liệt kê là không-phân-biệt. Lệnh suite xanh-cả-hai-phía là regression-guard bình thường.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 8: không eval nào của hợp đồng thất bại (E1 đến E9 đạt, E10 đề xuất PASS chờ người). Lệnh suite «cd app && npx tsc --noEmit && npm run lint» không gắn eval báo lỗi kiểm kiểu (thiếu tệp kiểu `.next/dev/types/routes.js`) nên verdict REJECT. Lịch sử các round trước nằm ở run-log.jsonl.
