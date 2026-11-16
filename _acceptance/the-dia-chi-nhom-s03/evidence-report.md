---
schema_version: 2
feature_slug: the-dia-chi-nhom-s03
verdict: REJECT
failed_evals: ["E9"]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 246b4e76ad14376630789d570878bb9a06eab823
human_signoff:
---

# Evidence Report: the-dia-chi-nhom-s03

Round 7. Nội dung thay trọn round cũ; lịch sử round nằm ở mục Iterations.

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
| E9 | AC-9 | test | FAIL |
| E10 | AC-10 | judgment | PASS (đề xuất của hội đồng, chờ người chốt ở Cổng 2) |

## Evidence

- eval: E1
  run_id: minted-the-dia-chi-nhom-s03-E1-r7
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg1_db
  verified_at: 2026-11-16T14:50:05Z
  output: |
    cmd: bash db/db-thu.sh oneinvest_suite_tg1 --chay node --test --test-concurrency=1 pipeline/tests/the-dia-chi-nhom.itest.mjs
    ℹ duration_ms 12823.842375

- eval: E3
  run_id: minted-the-dia-chi-nhom-s03-E3-r7
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg1_db
  verified_at: 2026-11-16T14:50:05Z
  output: |
    cmd: bash db/db-thu.sh oneinvest_suite_tg1 --chay node --test --test-concurrency=1 pipeline/tests/the-dia-chi-nhom.itest.mjs
    ℹ duration_ms 12823.842375

- eval: E2
  run_id: minted-the-dia-chi-nhom-s03-E2-r7
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg1_unit
  verified_at: 2026-11-16T14:50:05Z
  output: |
    cmd: node --test pipeline/tests/the-dia-chi-nhom.test.mjs
    ℹ duration_ms 47.450375

- eval: E4
  run_id: minted-the-dia-chi-nhom-s03-E4-r7
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg1_app
  verified_at: 2026-11-16T14:50:05Z
  output: |
    cmd: cd app && bash ../db/db-thu.sh oneinvest_suite_tg1a --chay node --import tsx --test --test-concurrency=1 tests/the-dia-chi-nhom-app.itest.tsx
    ℹ duration_ms 10875.163375

- eval: E6
  run_id: minted-the-dia-chi-nhom-s03-E6-r7
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg1_app
  verified_at: 2026-11-16T14:50:05Z
  output: |
    cmd: cd app && bash ../db/db-thu.sh oneinvest_suite_tg1a --chay node --import tsx --test --test-concurrency=1 tests/the-dia-chi-nhom-app.itest.tsx
    ℹ duration_ms 10875.163375

- eval: E7
  run_id: minted-the-dia-chi-nhom-s03-E7-r7
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tg1_that_dem
  verified_at: 2026-11-16T14:50:05Z
  output: |
    cmd: mkdir -p .acceptance-runs/the-dia-chi-nhom-s03 && node pipeline/scripts/the-dia-chi-nhom-that.mjs --dem --ghi .acceptance-runs/the-dia-chi-nhom-s03/so-chay-thu.md
    **ĐẠT**

- eval: E8
  run_id: minted-the-dia-chi-nhom-s03-E8-r7
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tg1_that_chat_luong
  verified_at: 2026-11-16T14:50:05Z
  output: |
    cmd: node pipeline/scripts/the-dia-chi-nhom-that.mjs --chat-luong
    khớp 12/13 (đạt khi từ 9)

- eval: E9
  run_id: minted-the-dia-chi-nhom-s03-E9-r7
  exit_code: 1
  baseline: n-a
  verifier: config:executors.test.tg1_lui
  verified_at: 2026-11-16T14:50:05Z
  output: |
    cmd: bash db/db-thu.sh oneinvest_suite_tg1l --chay node --test --test-concurrency=1 pipeline/tests/the-dia-chi-nhom-lui.itest.mjs
    ℹ tests 3 / pass 2 / fail 1
    TG1-AC-9b tệp lùi chạy thật: hai bảng mất, áp lại 108 được, kiem-sau chạy và in số thẻ — lỗi
    error: column "retired_at" does not exist (hint: group_address_cards.decided_at)
    tại pipeline/tests/the-dia-chi-nhom-lui.itest.mjs:57
    Nguyên nhân: commit 246b4e76 (migration 109) sửa kiem-sau.sql nhưng bộ kiểm E9 vẫn chỉ áp 108.

- eval: E5
  run_id: minted-the-dia-chi-nhom-s03-E5-r7
  exit_code: 0
  baseline: n-a
  verifier: config:dev_server.start
  verified_at: 2026-11-16T14:50:05Z
  screenshot: evidence/E5-step1.png
  observed: |
    Đã mở trực tiếp các frame chính. E5-step1: trang «Thẻ địa chỉ nhóm» ở 1280, badge «26 nhóm có thẻ» và «26 chờ duyệt», cột Thẻ toàn badge «Nháp», email thanh bên bị che bằng khối đen; hai hàng cuối mờ «Chưa có trong sổ». E5-step2: hộp «Duyệt thẻ TN-008 Nháp» bốn ô, mỗi ô một dòng căn cứ; step3 badge «Đã duyệt» và bộ đếm «25 chờ duyệt»; step5 bác không lý do thì nút Bác mờ và có dòng gợi ý, sau đó badge đỏ «Bác»; ô trống nói «Chưa đủ căn cứ (1 bài đã đọc)»; hộp xung đột có Alert đỏ và nút «Tải lại thẻ», chữ lý do còn nguyên; vai Người xem chỉ có nút «Đóng»; khổ 375 cuộn ngang trong khung. Tất cả khớp Expected. Hai điểm nhỏ không làm hỏng: bác không lý do bị chặn bằng nút tắt kèm chữ gợi ý chứ không có lỗi đỏ; ở vai viewer chip dự án vẫn hiện dấu × nhưng không xoá được.
  network_observed: clean

- eval: E10
  judged_by: judge panel (3 lens, fresh context) — đề xuất, không thay người
  verdict: PASS
  rationale: Ba lens cùng nghiêng PASS; chi tiết ở mục Judge. Đây là đề xuất, quyết định ở người.
  human_override:  # chi nguoi ghi

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-the-dia-chi-nhom-s03-SUITE-npm_test__bb6271-r7
  exit_code: 0
  verified_at: 2026-11-16T14:50:05Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-the-dia-chi-nhom-s03-SUITE-lint-r7
  exit_code: 0
  verified_at: 2026-11-16T14:50:05Z

- cmd: cd app && npm test
  run_id: minted-the-dia-chi-nhom-s03-SUITE-npm_test__bd9a35-r7
  exit_code: 0
  verified_at: 2026-11-16T14:50:05Z

- cmd: cd pipeline && npm run test:a
  run_id: minted-the-dia-chi-nhom-s03-SUITE-test_a-r7
  exit_code: 0
  verified_at: 2026-11-16T14:50:05Z

- cmd: cd pipeline && npm run test:b
  run_id: minted-the-dia-chi-nhom-s03-SUITE-test_b-r7
  exit_code: 0
  verified_at: 2026-11-16T14:50:05Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-the-dia-chi-nhom-s03-SUITE-test_lint_rules-r7
  exit_code: 0
  verified_at: 2026-11-16T14:50:05Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-the-dia-chi-nhom-s03-SUITE-node_scripts_check_portal_compliance_mjs-r7
  exit_code: 0
  verified_at: 2026-11-16T14:50:05Z

### Lệnh fail không gắn eval

Không có. Lệnh duy nhất thất bại (bộ kiểm lùi tg1_lui) thuộc E9, đã nêu ở khối E9.

## Judge

Panel đề xuất cho E10: PASS. human_override để TRỐNG cho người quyết ở Cổng 2.

- domain-correctness: PASS — Thẻ đủ ô ghi nguồn và số bài cho dự án (47 bài), bán/thuê (254 bán, 1.033 thuê) và phân khu (chưa đủ căn cứ, 1.408 bài). Ô phường·tỉnh chỉ ghi «theo dự án», không có số bài riêng nhưng nguồn rõ vì phường suy ra từ dự án. Thẻ ô trống ghi «Chưa đủ căn cứ (1 bài đã đọc)» ở mọi ô. CONTEXT.md có mục «Thẻ địa chỉ nhóm» với định nghĩa, mã `group_address_card`, mã thẻ TN-001, slug `group-cards` và _Avoid_.
- operational-feasibility: PASS — Thẻ đủ ô ghi nguồn và số bài cho từng ô; riêng ô phường chỉ ghi «theo dự án», nêu nguồn nhưng không có số bài. Thẻ ô trống ghi «Chưa đủ căn cứ (1 bài đã đọc)» ở cả bốn ô. CONTEXT.md có mục «Thẻ địa chỉ nhóm» đủ nhãn, định nghĩa, mã, slug và _Avoid_.
- spec-alignment: PASS — Ảnh thẻ đủ ô (TN-120) có chú thích dưới từng ô nói rõ nguồn và số bài; ảnh thẻ ô trống (TN-117) ghi «Chưa đủ căn cứ (1 bài đã đọc)» ở cả bốn ô nên người duyệt biết vì sao trống. CONTEXT.md có mục «Thẻ địa chỉ nhóm» với nhãn, mã, định nghĩa, slug và _Avoid_.

Lưu ý cho người quyết: finding t7 (review-findings.md, mục Trong hợp đồng, AC-10) nêu dòng căn cứ có thể gán căn cứ của máy cho giá trị người vừa sửa, điều hội đồng trên chưa xét.

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay (evals.yaml khong doi tu lan baseline cuoi). Mọi block eval ghi baseline n-a.

Eval không-phân-biệt: none. Lệnh suite xanh cả hai phía là regression-guard bình thường, không liệt kê.

## Variance

none — mọi eval chạy một lần, kết quả đồng nhất.

## Iterations

Round 6: REJECT, 0 lỗi trong hợp đồng; truy nguyên E7 và suite lint (theo commit c36b32b9).
Round 7: E9 đỏ — migration 109 (commit 246b4e76) đổi kiem-sau.sql (đọc retired_at, cột so_the thành so_the_song/so_the_nghi) mà bộ kiểm tg1_lui chỉ áp 108 và còn dò cột so_the. Trả về thực hiện: nối 109 vào danh sách migration của TG1-AC-9b và dò cột so_the_song.
