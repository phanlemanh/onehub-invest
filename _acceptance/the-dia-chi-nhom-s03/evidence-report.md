---
schema_version: 2
feature_slug: the-dia-chi-nhom-s03
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 77115140cdfcc85b72d68ac53f12793c23f3eeb9
human_signoff:
---

# Evidence Report: the-dia-chi-nhom-s03

Round 2. Báo cáo này thay trọn báo cáo round 1; lịch sử round nằm ở mục Iterations. Tám eval máy (E1–E4, E6–E9) và E5 (ui-check) carry-forward từ round 1 vì delta không chạm paths của chúng. Verdict REJECT do hai lệnh suite hồi quy không gắn eval chạy đỏ (xem mục «Lệnh suite fail không gắn eval»).

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS (carry-forward từ round 1) |
| E2 | AC-2 | test | PASS (carry-forward từ round 1) |
| E3 | AC-3 | test | PASS (carry-forward từ round 1) |
| E4 | AC-4 | test | PASS (carry-forward từ round 1) |
| E5 | AC-5 | ui-check | PASS (carry-forward từ round 1) |
| E6 | AC-6 | test | PASS (carry-forward từ round 1) |
| E7 | AC-7 | script | PASS (carry-forward từ round 1) |
| E8 | AC-8 | script | PASS (carry-forward từ round 1) |
| E9 | AC-9 | test | PASS (carry-forward từ round 1) |
| E10 | AC-10 | judgment | đề xuất PASS của hội đồng, chờ người (human_override trống) |

## Evidence

- eval: E1
  run_id: minted-the-dia-chi-nhom-s03-E1-r1
  exit_code: 0
  carried_from_round: 1
  baseline: n-a
  verifier: config:executors.test.tg1_db
  verified_at: 2026-11-16T02:41:51Z
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E2
  run_id: minted-the-dia-chi-nhom-s03-E2-r1
  exit_code: 0
  carried_from_round: 1
  baseline: n-a
  verifier: config:executors.test.tg1_unit
  verified_at: 2026-11-16T02:41:51Z
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E3
  run_id: minted-the-dia-chi-nhom-s03-E3-r1
  exit_code: 0
  carried_from_round: 1
  baseline: n-a
  verifier: config:executors.test.tg1_db
  verified_at: 2026-11-16T02:41:51Z
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E4
  run_id: minted-the-dia-chi-nhom-s03-E4-r1
  exit_code: 0
  carried_from_round: 1
  baseline: n-a
  verifier: config:executors.test.tg1_app
  verified_at: 2026-11-16T02:41:51Z
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E5
  run_id: E5-ui-20261116
  exit_code: 0
  carried_from_round: 1
  baseline: n-a
  verifier: config:dev_server.start
  verified_at: 2026-11-16T02:41:51Z
  screenshot: evidence/E5-step1.png
  observed: |
    E5-step1.png (1280, sáng): tiêu đề «Thẻ địa chỉ nhóm», hai badge «28 nhóm có thể» và «28 chờ duyệt» khớp 28 lệnh dựng nháp in; bảng 28 hàng badge vàng «Nháp», nút «Duyệt thẻ»; hàng cuối «Chưa có trong sổ»; email sidebar che «•••@•••».
    E5-step2.png: hộp «Duyệt thẻ TN-008» có bốn ô kèm dòng căn cứ chữ xám (nguồn và số bài), nút Bác và Nhận. E5-step3/4/5: nhận, sửa, bác đổi badge và bộ đếm, toast tương ứng; bác khi ghi chú dưới 3 ký tự bị chặn bằng gợi ý.
    E5-step-o-trong.png: ô trống ghi «Chưa đủ căn cứ (số bài đã đọc)». E5-step-409.png: Alert «Thẻ đã đổi từ lúc anh mở» giữ chữ đã nhập, có nút «Tải lại thẻ». E5-step-viewer.png: vai viewer chỉ có nút Đóng. E5-step6.png và E5-step6-hop.png (375): vừa màn hình, không tràn trang. Khớp expected.
  network_observed: clean
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E6
  run_id: minted-the-dia-chi-nhom-s03-E6-r1
  exit_code: 0
  carried_from_round: 1
  baseline: n-a
  verifier: config:executors.test.tg1_app
  verified_at: 2026-11-16T02:41:51Z
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E7
  run_id: minted-the-dia-chi-nhom-s03-E7-r1
  exit_code: 0
  carried_from_round: 1
  baseline: n-a
  verifier: config:executors.script.tg1_that_dem
  verified_at: 2026-11-16T02:41:51Z
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E8
  run_id: minted-the-dia-chi-nhom-s03-E8-r1
  exit_code: 0
  carried_from_round: 1
  baseline: n-a
  verifier: config:executors.script.tg1_that_chat_luong
  verified_at: 2026-11-16T02:41:51Z
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E9
  run_id: minted-the-dia-chi-nhom-s03-E9-r1
  exit_code: 0
  carried_from_round: 1
  baseline: n-a
  verifier: config:executors.test.tg1_lui
  verified_at: 2026-11-16T02:41:51Z
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

### Judgment

- eval: E10
  judged_by: hội đồng ba lens (domain-correctness, operational-feasibility, spec-alignment)
  proposal: PASS
  panel:
    - domain-correctness: PASS — Thẻ TN-008 ghi nguồn và số bài ở từng ô (dự án «từ bài đã đọc, 44 bài», phường·tỉnh «theo dự án», bán/thuê «248 bán, 1.001 thuê», phân khu «Chưa đủ căn cứ (1.351 bài đã đọc)»). Thẻ TN-005 ghi «Chưa đủ căn cứ (1 bài đã đọc)» ở mọi ô trống nên người duyệt hiểu vì sao trống. CONTEXT.md có mục «Thẻ địa chỉ nhóm» đủ nhãn, mã (`group_address_card`, `TN-001`, slug `group-cards`) và định nghĩa nêu rõ mỗi ô ghi nguồn cùng số bài làm căn cứ.
    - operational-feasibility: PASS — Ảnh thẻ TN-008 ghi nguồn và số bài cho từng ô; ảnh thẻ TN-005 có cả bốn ô trống kèm lý do «Chưa đủ căn cứ (1 bài đã đọc)». CONTEXT.md có mục «Thẻ địa chỉ nhóm» đủ nhãn, mã, định nghĩa, slug `group-cards` và _Avoid_.
    - spec-alignment: PASS — Ảnh TN-008 ghi nguồn và số bài ở từng ô; ảnh TN-005 ghi «Chưa đủ căn cứ (1 bài đã đọc)» ở cả bốn ô. CONTEXT.md dòng 835 có mục «Thẻ địa chỉ nhóm» đủ nhãn, định nghĩa, mã `group_address_card` / `TN-001`, slug `group-cards` và _Avoid_. Điểm nhỏ: ô phường chỉ ghi «theo dự án», không kèm số bài, nhưng nguồn vẫn rõ vì suy ra từ dự án đã có số bài.
  human_override:  # chi nguoi ghi

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-the-dia-chi-nhom-s03-SUITE-npm_test__bb6271-r2
  exit_code: 1
  baseline: n-a
  verified_at: 2026-11-16T03:22:37Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-the-dia-chi-nhom-s03-SUITE-lint-r2
  exit_code: 0
  baseline: n-a
  verified_at: 2026-11-16T03:22:37Z

- cmd: cd app && npm test
  run_id: minted-the-dia-chi-nhom-s03-SUITE-npm_test__bd9a35-r2
  exit_code: 1
  baseline: n-a
  verified_at: 2026-11-16T03:22:37Z

- cmd: cd pipeline && npm run test:a
  run_id: minted-the-dia-chi-nhom-s03-SUITE-test_a-r2
  exit_code: 0
  baseline: n-a
  verified_at: 2026-11-16T03:22:37Z

- cmd: cd pipeline && npm run test:b
  run_id: ba4duoa3f
  exit_code: 0
  baseline: n-a
  verified_at: 2026-11-16T03:22:37Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-the-dia-chi-nhom-s03-SUITE-test_lint_rules-r2
  exit_code: 0
  baseline: n-a
  verified_at: 2026-11-16T03:22:37Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-the-dia-chi-nhom-s03-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  baseline: n-a
  verified_at: 2026-11-16T03:22:37Z

### Lệnh suite fail không gắn eval

Hai lệnh sau chạy đỏ và không gắn eval nào, nên `failed_evals` để trống nhưng verdict là REJECT:

1. `cd agent && npm test` — 343 ca, 341 pass, 1 đỏ, 1 bỏ qua. Ca đỏ là «LS1-AC-7 đầu ghi khớp fixture thẻ mà app duyệt qua route» (`agent/tests/doc-toan-bo-the.test.ts`, qua `withTx` ở `tests/helpers/db.ts`). Lỗi Postgres mã 40P01, deadlock detected: hai tiến trình chờ khoá chéo trên hai quan hệ. Lỗi này nhiều khả năng do hai tiến trình tranh khoá trên DB thử. Cần xác định có do bảng TG1 (108) hay do chạy song song với suite khác trước khi kết luận.
2. `cd app && npm test` — đỏ ở `tests/ops-nhan-theo-context.test.tsx`, hai ca:
   - ca so danh sách tệp nhận diện (deepStrictEqual): danh sách thực tế có thêm các tệp `src/app/ops/group-cards/page.tsx` và `src/components/ops/group-cards/*`, trong khi danh sách mong đợi chỉ có `src/components/ops/review-content.tsx`.
   - ca «ON12-AC-1 0 từ _Avoid_ trên chuỗi hiển thị của phạm vi quét»: còn 2 chỗ chứa từ _Avoid_ trên cổng Ops, tại `src/components/ops/labels/luot-hai.tsx:95` («Thẻ nhóm») và `src/components/shell/nav.tsx:154` («Thẻ địa chỉ nhóm»).

Năm lệnh suite còn lại (tsc cùng lint, `test:a`, `test:b`, `test:lint-rules`, `check-portal-compliance`) xanh.

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay

none — không có eval nào xanh cả hai phía được liệt kê; mọi `baseline:` ghi n-a vì round này không đo lại. Các lệnh suite xanh cả hai phía là regression-guard bình thường, không liệt kê.

## Variance

none — không eval nào có runs lớn hơn 1; mọi eval là deterministic.

## Iterations

Round 1: E1–E9 PASS (2026-11-16T02:41:51Z); E10 hội đồng đề xuất PASS; chờ người. Commit gần nhất sửa kiểm kê route viewer và ma trận gán khu vực (S4 r1).
Round 2: E1–E9 carry-forward; hai lệnh suite hồi quy (`cd agent && npm test`, `cd app && npm test`) đỏ và không gắn eval — một deadlock DB ở ca LS1-AC-7 và hai ca nhãn Ops (danh sách tệp nhận diện thiếu route `group-cards`, 2 chỗ còn từ _Avoid_). Trả về implementation.
